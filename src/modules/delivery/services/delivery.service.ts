import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch'; // Se não tiver: npm i node-fetch@2
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
  private readonly HQ_LAT = parseFloat(process.env.HQ_LAT || '-30.1146');
  private readonly HQ_LNG = parseFloat(process.env.HQ_LNG || '-51.1281');

  // Fila de entregadores online e sem rota
  private deliveryQueue: string[] = [];
  private waitingRouteRequests: Array<{
    orderIds: string[];
    editionId: string;
  }> = [];

  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    configService: ConfigService,
    private readonly gateway: DeliveryGateway,
    private readonly evolutionNotifications: EvolutionNotificationsService,
  ) {
    super(loggerService, prismaService, configService);
  }

  // ----- Controle online/offline via Mongo -----
  async setDeliveryPersonOnlineStatus(
    deliveryPersonId: string,
    online: boolean,
  ) {
    await this.prisma.deliveryPerson.update({
      where: { id: deliveryPersonId },
      data: { active: online },
    });
    // Atualiza fila local em memória
    if (online) {
      if (!this.deliveryQueue.includes(deliveryPersonId))
        this.deliveryQueue.push(deliveryPersonId);
    } else {
      this.deliveryQueue = this.deliveryQueue.filter(
        (id) => id !== deliveryPersonId,
      );
    }
    // Notifica gerentes/frontends
    this.gateway.server.emit('delivery-person:online', {
      deliveryPersonId,
      online,
    });
    return { ok: true };
  }

  // Consulta entregadores realmente online (ativo no banco)
  async listOnlineDeliveryPersons(): Promise<string[]> {
    const persons = await this.prisma.deliveryPerson.findMany({
      where: { active: true },
    });
    return persons.map((p) => p.id);
  }

  // ----- Lógica da Fila -----
  async processExpeditionRoute(orderIds: string[], editionId: string) {
    // Atualiza fila a partir do banco, remove ocupados
    const onlineIds = await this.listOnlineDeliveryPersons();
    const busy = (
      await this.prisma.deliveryRoute.findMany({
        where: { status: { in: ['pending', 'in_progress'] }, active: true },
      })
    ).map((r) => r.deliveryPersonId);

    const available = onlineIds.filter((id) => !busy.includes(id));
    if (!available.length) throw new Error('Nenhum entregador disponível');

    // Escolhe aleatório (pode usar round robin fifo se preferir)
    const candidate = available[Math.floor(Math.random() * available.length)];

    // Garante na fila local também
    if (!this.deliveryQueue.includes(candidate))
      this.deliveryQueue.push(candidate);

    this.waitingRouteRequests.push({ orderIds, editionId });

    // Dispara alerta apenas para o candidato via socket
    this.gateway.sendToDeliveryPerson(candidate, 'queue:route', {
      orderIds,
      editionId,
      message: 'Nova rota disponível para você!',
    });
  }

  // ----- Aceitar ou recusar rota (chamado pelo socket gateway) -----
  async queueRouteResponse(payload: {
    deliveryPersonId: string;
    accepted: boolean;
    orderIds: string[];
    editionId?: string;
  }) {
    if (payload.accepted) {
      await this.generateRoute(payload.orderIds, payload.deliveryPersonId);
    } else {
      // Remove da fila e tenta próximo
      this.deliveryQueue = this.deliveryQueue.filter(
        (id) => id !== payload.deliveryPersonId,
      );
      const idx = this.waitingRouteRequests.findIndex(
        (r) => JSON.stringify(r.orderIds) === JSON.stringify(payload.orderIds),
      );
      if (idx >= 0) {
        const request = this.waitingRouteRequests[idx];
        this.waitingRouteRequests.splice(idx, 1);
        await this.processExpeditionRoute(request.orderIds, request.editionId);
      }
    }
  }

  // ----- Rota direta (ERP/Manager designa voluntário específico) -----
  async generateRoute(orderIds: string[], deliveryPersonId: string) {
    if (!orderIds || !orderIds.length) throw new Error('No order IDs provided');
    // Busca pedidos, endereços
    const orders = await this.prisma.orderOnline.findMany({
      where: { id: { in: orderIds }, active: true },
      include: { customer: true, address: true, preOrderItems: true },
    });

    // Geocodifica e ordena por vizinhança
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
      }
    }
    if (!points.length) throw new Error('No points with coordinates');

    // Nearest neighbor para sequência das paradas
    const sequence: typeof points = [];
    let current = { lat: this.HQ_LAT, lng: this.HQ_LNG };
    const remaining = [...points];
    while (remaining.length) {
      let bestIdx = 0,
        bestDist = Infinity;
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

    // Cria rota DeliveryRoute/stops
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

    // Notifica voluntário por socket (+ WhatsApp/evolution opcional)
    try {
      const person = await this.prisma.deliveryPerson.findUnique({
        where: { id: deliveryPersonId },
      });
      const phone = person?.phone;
      if (phone)
        await this.evolutionNotifications.sendRouteAssigned(
          phone,
          sequence.length,
        );
    } catch (err) {
      this.logger.error('Notif error: ' + err.message);
    }

    this.gateway.broadcastRouteCreated(route);
    return route;
  }

  // ---- Iniciar rota, stops, finalização ----
  async startRoute(routeId: string) {
    const route = await this.prisma.deliveryRoute.update({
      where: { id: routeId },
      data: { startedAt: new Date(), status: 'in_progress' },
      include: { stops: true, deliveryPerson: true },
    });

    // Marca o primeiro stop como delivering
    const nextStop = route.stops.find((s) => s.status === 'pending');
    if (nextStop) {
      await this.prisma.deliveryStop.update({
        where: { id: nextStop.id },
        data: { status: 'delivering' },
      });
      this.gateway.broadcastStopUpdated(nextStop.routeId, nextStop.id);
      const order = await this.prisma.orderOnline.findUnique({
        where: { id: nextStop.orderId },
        include: { customer: true },
      });
      if (order?.customer?.phone) {
        await this.evolutionNotifications.sendNextDelivery(
          order.customer.phone,
          order.customer.name,
        );
      }
    }
    this.gateway.broadcastRouteStarted(route);
    return route;
  }

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

    if (status === 'delivered') {
      await this.prisma.deliveryRoute.update({
        where: { id: stop.routeId },
        data: { completedStops: { increment: 1 } },
      });
    }
    this.gateway.broadcastStopUpdated(stop.routeId, stop.id);

    // Notificações ao cliente/manager
    const customerPhone = stop.order?.customer?.phone;
    if (customerPhone) {
      if (status === 'delivered') {
        await this.evolutionNotifications.orderDelivered(
          customerPhone,
          stop.orderId,
        );
      } else if (status === 'skipped') {
        await this.evolutionNotifications.orderDeliverySkiped(customerPhone);
      } else if (status === 'failed') {
        await this.evolutionNotifications.orderDeliveryFailed(
          customerPhone,
          stop.orderId,
        );
      }
    }

    // Finaliza rota se todas paradas completas
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

  // Location update e broadcast
  async updateLocation(deliveryPersonId: string, lat: number, lng: number) {
    // Salva local no campo deliveryPerson se desejar (adapte seu model)
    await this.prisma.deliveryPerson.update({
      where: { id: deliveryPersonId },
      data: {
        /* lat, lng */
      },
    });
    this.gateway.broadcastLocationUpdate(deliveryPersonId, lat, lng);
    return { ok: true };
  }

  // Listar entregadores (para painel DM)
  async listDeliveryPersons(onlyActive?: boolean) {
    const where: any = {};
    if (onlyActive !== undefined) where.active = onlyActive;
    const persons = await this.prisma.deliveryPerson.findMany({ where });
    return persons.map((p) => ({
      id: p.id,
      name: p.name,
      phone: p.phone,
      active: p.active,
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

  async setDeliveryPersonStatus(
    deliveryPersonId: string,
    online: boolean,
    inRoute?: boolean,
  ) {
    console.log('receidev call: ' + deliveryPersonId + ' - ' + online);
    const data: any = { online };
    if (typeof inRoute === 'boolean') data.inRoute = inRoute;
    await this.prisma.deliveryPerson.update({
      where: { id: deliveryPersonId },
      data: {
        online: online,
      },
    });
    // Notifica via socket (opcional)
    this.gateway.server.emit('delivery-person:status', {
      deliveryPersonId,
      ...data,
    });
    return { ok: true, status: data };
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

  // --- Geocode de endereço ---
  private async geocodeAddress(address: string) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
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

  async getDeliveryPersonStatus(deliveryPersonId: string) {
    const dp = await this.prisma.deliveryPerson.findUnique({
      where: { id: deliveryPersonId },
      select: { online: true, inRoute: true },
    });
    return dp || { online: false, inRoute: false };
  }
}
