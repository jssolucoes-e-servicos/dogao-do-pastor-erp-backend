import { Injectable } from '@nestjs/common';

import fetch from 'node-fetch'; // `npm i node-fetch@2` se precisar
import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer-helper';
import { EvolutionNotificationsService } from 'src/modules/evolution/services/evolution-notifications.service';
import { DeliveryGateway } from '../gateways/delivery.gateway';
import { haversineDistance } from '../utils/geo';

@Injectable()
export class DeliveryService extends BaseService {
  // optional in-memory last locations (consider Redis for production)
  private lastLocations: Record<
    string,
    { lat: number; lng: number; updatedAt: Date }
  > = {};
  private readonly HQ_LAT = parseFloat(process.env.HQ_LAT || '-30.1146');
  private readonly HQ_LNG = parseFloat(process.env.HQ_LNG || '-51.1281');

  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    configService: ConfigService,
    private readonly gateway: DeliveryGateway,
    private readonly evolutionNotifications: EvolutionNotificationsService,
  ) {
    super(loggerService, prismaService, configService);
  }

  // --- helper: geocode an address with Nominatim (optional) ---
  private async geocodeAddress(address: string) {
    // Keep this optional — Nominatim free service has rate limits. You can replace with Google geocoding if you have key.
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address,
      )}&limit=1`;
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'dogao-delivery/1.0 (+https://igrejavivaemcelulas.com.br)',
        },
      });
      const json = await res.json();
      if (json && json.length > 0) {
        return { lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) };
      }
    } catch (err) {
      this.logger.error('Geocode failed: ' + err.message);
    }
    return null;
  }

  // core: generate route using nearest neighbor starting from HQ
  async generateRoute(orderIds: string[], deliveryPersonId: string) {
    if (!orderIds || orderIds.length === 0) {
      throw new Error('No order IDs provided');
    }

    // Fetch orders + address + customer
    const orders = await this.prisma.orderOnline.findMany({
      where: { id: { in: orderIds }, active: true },
      include: {
        customer: true,
        address: true,
        preOrderItems: true,
      },
    });

    // For each order, try to get lat/lng (use order.address lat/lng if you store it,
    // otherwise geocode concatenated address)
    const points: Array<{
      orderId: string;
      lat: number;
      lng: number;
      order: any;
    }> = [];

    for (const o of orders) {
      let lat = (o as any).address?.lat ?? (o as any).address?.latitude;
      let lng = (o as any).address?.lng ?? (o as any).address?.longitude;
      if (lat == null || lng == null) {
        // build address text
        const addr = o.address
          ? `${o.address.street} ${o.address.number || ''}, ${o.address.neighborhood || ''} ${o.address.city || ''} ${o.address.state || ''}`
          : `${o.customer?.name || ''}`;
        const geoc = await this.geocodeAddress(addr);
        if (geoc) {
          lat = geoc.lat;
          lng = geoc.lng;
        }
      }
      if (lat != null && lng != null) {
        points.push({
          orderId: o.id,
          lat: Number(lat),
          lng: Number(lng),
          order: o,
        });
      } else {
        this.logger.warn(
          `Order ${o.id} has no coordinates, skipping from route generation.`,
        );
      }
    }

    if (points.length === 0) {
      throw new Error('No points with coordinates available to generate route');
    }

    // nearest neighbor order
    const sequence: typeof points = [];
    let current = { lat: this.HQ_LAT, lng: this.HQ_LNG };
    const remaining = [...points];

    while (remaining.length > 0) {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const p = remaining[i];
        const d = haversineDistance(current.lat, current.lng, p.lat, p.lng);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      const picked = remaining.splice(bestIdx, 1)[0];
      sequence.push(picked);
      current = { lat: picked.lat, lng: picked.lng };
    }

    // optionally return to HQ — sequence remains as is, we don't explicitly add HQ as stop
    // create DeliveryRoute and stops
    const route = await this.prisma.deliveryRoute.create({
      data: {
        deliveryPersonId,
        status: 'pending',
        totalStops: sequence.length,
        completedStops: 0,
        stops: {
          create: sequence.map((p, idx) => ({
            orderId: p.orderId,
            sequence: idx + 1,
            status: 'pending',
            lat: p.lat,
            lng: p.lng,
          })),
        },
      },
      include: { stops: true },
    });

    // notify delivery person (via WhatsApp) that a route was assigned
    try {
      const person = await this.prisma.deliveryPerson.findUnique({
        where: { id: deliveryPersonId },
      });
      const phone = person?.phone;
      if (phone) {
        // build short message
        //const msg = `🚚 *Rota de entrega atribuída*\nVocê tem ${sequence.length} parada(s).\nInicie a rota no app para ver a ordem e começar a entregar.`;
        await this.evolutionNotifications.sendRouteAssigned(
          phone,
          sequence.length,
        );
      }
    } catch (err) {
      this.logger.error('Error notifying delivery person: ' + err.message);
    }

    // broadcast route created
    this.gateway.broadcastRouteCreated(route);

    return route;
  }

  // start route
  async startRoute(routeId: string) {
    const route = await this.prisma.deliveryRoute.update({
      where: { id: routeId },
      data: { startedAt: new Date(), status: 'in_progress' },
      include: { stops: true, deliveryPerson: true },
    });

    // mark first stop as delivering (optional)
    const nextStop = route.stops.find((s) => s.status === 'pending');
    if (nextStop) {
      await this.prisma.deliveryStop.update({
        where: { id: nextStop.id },
        data: { status: 'delivering' },
      });
      this.gateway.broadcastStopUpdated(nextStop.routeId, nextStop.id);
      // notify client and delivery person:
      const order = await this.prisma.orderOnline.findUnique({
        where: { id: nextStop.orderId },
        include: { customer: true },
      });
      if (order?.customer?.phone) {
        // send "your house is next"
        await this.evolutionNotifications.sendNextDelivery(
          order.customer.phone,
          order.customer.name,
        );
      }
    }

    // notify delivery manager via gateway
    this.gateway.broadcastRouteStarted(route);

    return route;
  }

  // update stop status (delivered, skipped, failed)
  async updateStopStatus(
    stopId: string,
    status: 'delivered' | 'skipped' | 'failed',
    reason?: string,
  ) {
    const now = new Date();
    const data: any = { status };
    if (status === 'delivered') data.deliveredAt = now;
    if (status === 'skipped') data.skippedAt = now;
    if (status === 'failed') data.failedAt = now;

    const stop = await this.prisma.deliveryStop.update({
      where: { id: stopId },
      data,
      include: { route: true, order: { include: { customer: true } } },
    });

    // increment route completedStops if delivered
    if (status === 'delivered') {
      await this.prisma.deliveryRoute.update({
        where: { id: stop.routeId },
        data: { completedStops: { increment: 1 } },
      });
    }

    // notify via websocket
    this.gateway.broadcastStopUpdated(stop.routeId, stop.id);

    // send notifications
    const customerPhone = stop.order?.customer?.phone;
    if (customerPhone) {
      if (status === 'delivered') {
        await this.evolutionNotifications.orderDelivered(customerPhone,stop.orderId);
      } else if (status === 'skipped') {
        await this.evolutionNotifications.orderDeliverySkiped(customerPhone);
      } else if (status === 'failed') {
        await this.evolutionNotifications.orderDeliveryFailed(customerPhone,stop.orderId);
      }
    }

    // if all stops completed or route finished, finalize route
    const route = await this.prisma.deliveryRoute.findUnique({
      where: { id: stop.routeId },
      include: { stops: true },
    });

    if (
      route &&
      route.stops.every(
        (s) =>
          s.status === 'delivered' ||
          s.status === 'skipped' ||
          s.status === 'failed',
      )
    ) {
      await this.prisma.deliveryRoute.update({
        where: { id: route.id },
        data: { status: 'finished', finishedAt: new Date() },
      });
      this.gateway.broadcastRouteFinished(route.id);
    }

    return stop;
  }

  // update location (from app) - broadcasts to websocket and stores last location in memory
  async updateLocation(deliveryPersonId: string, lat: number, lng: number) {
    this.lastLocations[deliveryPersonId] = { lat, lng, updatedAt: new Date() };
    // broadcast
    this.gateway.broadcastLocationUpdate(deliveryPersonId, lat, lng);
    return { ok: true };
  }

  // list delivery persons with status and last location
  async listDeliveryPersons(onlyActive?: boolean) {
    const where: any = {};
    if (onlyActive !== undefined) where.active = onlyActive;

    const persons = await this.prisma.deliveryPerson.findMany({
      where,
      include: { user: true },
    });

    return persons.map((p) => ({
      id: p.id,
      name: p.name,
      phone: p.phone,
      active: p.active,
      lastLocation: this.lastLocations[p.id] ?? null,
      // status is deduced by active + if has in_progress route
    }));
  }

  async getRoutesByDeliveryPerson(deliveryPersonId: string) {
    const routes = await this.prisma.deliveryRoute.findMany({
      where: { deliveryPersonId },
      include: { stops: true },
      orderBy: { createdAt: 'desc' },
    });
    return routes;
  }

  async getRouteDetails(routeId: string) {
    const route = await this.prisma.deliveryRoute.findUnique({
      where: { id: routeId },
      include: {
        stops: { orderBy: { sequence: 'asc' } },
        deliveryPerson: true,
      },
    });
    return route;
  }
}
