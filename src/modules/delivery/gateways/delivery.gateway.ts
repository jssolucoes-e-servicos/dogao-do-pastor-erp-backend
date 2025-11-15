import { Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/common/helpers/importer-helper';

// Helper para room por entregador
function roomForDeliveryPerson(deliveryPersonId: string) {
  return `deliveryPerson:${deliveryPersonId}`;
}

/**
 * DeliveryGateway
 * - Gerencia comunicação real-time com entregador e painel
 */
@WebSocketGateway({
  namespace: 'delivery',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
@Injectable()
export class DeliveryGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  // Rooms socket<>entregador
  private socketsByDeliveryPerson: Record<string, Set<string>> = {};

  // ----- Connection Lifecycle -----
  handleConnection(client: Socket) {
    // Opcional: autenticação com token no handshake
    // TODO: validar JWT, associar à deliveryPersonId
    console.log(
      '[Gateway] Cliente conectado:',
      client.id,
      'Query:',
      client.handshake.query,
    );
  }

  handleDisconnect(client: Socket) {
    for (const dpId of Object.keys(this.socketsByDeliveryPerson)) {
      if (this.socketsByDeliveryPerson[dpId].has(client.id)) {
        this.socketsByDeliveryPerson[dpId].delete(client.id);
        if (this.socketsByDeliveryPerson[dpId].size === 0)
          delete this.socketsByDeliveryPerson[dpId];
      }
    }
  }

  // ----- Subscribe events - do client para o server -----

  /**
   * Entregador envia posição via websocket
   * { deliveryPersonId, lat, lng }
   */
  @SubscribeMessage('location:update:in')
  async handleLocationUpdate(
    @MessageBody()
    payload: { deliveryPersonId: string; lat: number; lng: number },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('[Gateway] Evento recebido: location:update:in =>', payload);
    try {
      const { deliveryPersonId, lat, lng } = payload;
      const data = {
        deliveryPersonId,
        lat,
        lng,
        updatedAt: new Date().toISOString(),
      };
      this.server.emit('location:update', data);
      this.server
        .to(roomForDeliveryPerson(deliveryPersonId))
        .emit('location:update', data);
      if (!this.socketsByDeliveryPerson[deliveryPersonId])
        this.socketsByDeliveryPerson[deliveryPersonId] = new Set();
      this.socketsByDeliveryPerson[deliveryPersonId].add(client.id);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  /**
   * Entregador entra em uma sala (room)
   * { room }
   */
  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() payload: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { room } = payload;
    if (!room) return;
    client.join(room);
    return { ok: true };
  }

  /**
   * Entregador sai de uma sala
   * { room }
   */
  @SubscribeMessage('leave')
  handleLeave(
    @MessageBody() payload: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { room } = payload;
    if (!room) return;
    client.leave(room);
    return { ok: true };
  }

  /**
   * Entregador responde ao alerta da fila (aceita/recusa rota)
   * { deliveryPersonId, accepted, orderIds, editionId }
   */
  @SubscribeMessage('queue:route:response')
  async receiveQueueRouteResponse(
    @MessageBody()
    payload: {
      deliveryPersonId: string;
      accepted: boolean;
      orderIds: string[];
      editionId?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    // Implementação no service do delivery (inject ali)
    // Para simplificar, só emite de volta, a lógica do service cuidará do resto
    this.server.emit('queue:route:response', payload);
    return { ok: true };
  }

  // ----- Emit (server para client) -----

  /**
   * Envia alert/modal para entregador disponível da fila
   * payload: { orderIds, editionId, message }
   */
  sendToDeliveryPerson(deliveryPersonId: string, event: string, payload: any) {
    console.log(
      `[Gateway] Emitindo evento ${event} para deliveryPerson:${deliveryPersonId} =>`,
      payload,
    );
    const room = roomForDeliveryPerson(deliveryPersonId);
    this.server.to(room).emit(event, payload);
  }

  /**
   * Broadcast dos eventos globais da entrega
   */
  broadcastLocationUpdate(deliveryPersonId: string, lat: number, lng: number) {
    const data = {
      deliveryPersonId,
      lat,
      lng,
      updatedAt: new Date().toISOString(),
    };
    this.server.emit('location:update', data);
    this.server
      .to(roomForDeliveryPerson(deliveryPersonId))
      .emit('location:update', data);
  }

  broadcastRouteCreated(route: any) {
    this.server.emit('route:created', route);
    const dpRoom = roomForDeliveryPerson(route.deliveryPersonId);
    this.server.to(dpRoom).emit('route:created', route);
  }

  broadcastRouteStarted(route: any) {
    this.server.emit('route:started', route);
    const dpRoom = roomForDeliveryPerson(route.deliveryPersonId);
    this.server.to(dpRoom).emit('route:started', route);
  }

  broadcastStopUpdated(routeId: string, stopId: string, stop?: any) {
    const payload = { routeId, stopId, stop: stop ?? null };
    this.server.emit('stop:updated', payload);
    this.server.to(`route:${routeId}`).emit('stop:updated', payload);
  }

  broadcastRouteFinished(routeId: string) {
    this.server.emit('route:finished', { routeId });
    this.server.to(`route:${routeId}`).emit('route:finished', { routeId });
  }

  /**
   * Atualiza status online/offline e salva no MongoDB (DeliveryPerson)
   * Usar no service: await gateway.setDeliveryPersonOnlineMongo(deliveryPersonId, online);
   */
  async setDeliveryPersonOnlineMongo(
    deliveryPersonId: string,
    online: boolean,
  ) {
    await this.prisma.deliveryPerson.update({
      where: { id: deliveryPersonId },
      data: { active: online },
    });
    // Notifica manager/entregadores
    this.server.emit('delivery-person:online', { deliveryPersonId, online });
  }
}
