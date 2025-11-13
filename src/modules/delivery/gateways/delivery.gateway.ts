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

/**
 * DeliveryGateway
 *
 * - Emite eventos globais para o painel (manager) e rooms por entregador.
 * - Recebe atualizações de localização do app do entregador via socket (evento 'location:update:in')
 * - Métodos utilitários para broadcast (usados pelo DeliveryService)
 *
 * Eventos emitidos (server -> client):
 * - 'location:update' { deliveryPersonId, lat, lng, updatedAt }
 * - 'route:created'   { route }
 * - 'route:started'   { route }
 * - 'stop:updated'    { routeId, stopId, stop }
 * - 'route:finished'  { routeId }
 *
 * Eventos aceitos (client -> server):
 * - 'location:update:in' { deliveryPersonId, lat, lng }  (entregador envia)
 * - 'join' { room }  (cliente se inscreve em room: ex: 'deliveryPerson:ID' ou 'manager')
 * - 'leave' { room } (sai do room)
 *
 * Nota: esse gateway foi mantido simples — para produção recomendo:
 * - autenticação do socket (JWT) no handshake,
 * - usar adapter Redis para escala (socket.io-redis),
 * - armazenar últimas localizações em Redis para múltiplas instâncias.
 */

@WebSocketGateway({
  namespace: '/delivery',
  cors: {
    origin: '*', // restrinja em prod
    methods: ['GET', 'POST'],
  },
})
@Injectable()
export class DeliveryGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Conexões ativas por socket id (opcional tracking)
  private socketsByDeliveryPerson: Record<string, Set<string>> = {};

  // --- Lifecycle ---
  handleConnection(client: Socket, ...args: any[]) {
    /*  this.logger.setLog(
      `Socket connected: ${client.id} (handshake: ${JSON.stringify(client.handshake.query)})`,
    ); */
    // Optional: authenticate here using token in handshake
    // const token = client.handshake.query?.token as string | undefined;
    // verify token if needed and attach user info to client.data
  }

  handleDisconnect(client: Socket) {
    //this.logger.setLog(`Socket disconnected: ${client.id}`);
    // remove from any deliveryPerson mappings
    for (const dpId of Object.keys(this.socketsByDeliveryPerson)) {
      if (this.socketsByDeliveryPerson[dpId].has(client.id)) {
        this.socketsByDeliveryPerson[dpId].delete(client.id);
        if (this.socketsByDeliveryPerson[dpId].size === 0)
          delete this.socketsByDeliveryPerson[dpId];
        /*  this.logger.setLog(
          `Socket ${client.id} removed from deliveryPerson ${dpId}`,
        ); */
      }
    }
  }

  // --- Client -> Server events ---

  /**
   * Entregador envia posição via websocket (opcional: app pode usar HTTP endpoint em vez disso)
   * payload: { deliveryPersonId, lat, lng }
   */
  @SubscribeMessage('location:update:in')
  async handleLocationUpdate(
    @MessageBody()
    payload: { deliveryPersonId: string; lat: number; lng: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { deliveryPersonId, lat, lng } = payload;
      // broadcast para todos (manager) e para a room específica do entregador
      const data = {
        deliveryPersonId,
        lat,
        lng,
        updatedAt: new Date().toISOString(),
      };
      // broadcast global
      this.server.emit('location:update', data);
      // broadcast para room
      this.server
        .to(this.roomForDeliveryPerson(deliveryPersonId))
        .emit('location:update', data);

      // track socket membership (optional)
      if (!this.socketsByDeliveryPerson[deliveryPersonId])
        this.socketsByDeliveryPerson[deliveryPersonId] = new Set();
      this.socketsByDeliveryPerson[deliveryPersonId].add(client.id);

      /*   this.logger.setLog(
        `Received location from ${deliveryPersonId}: ${lat},${lng}`,
      ); */
      return { ok: true };
    } catch (err) {
      //  this.logger.setError('handleLocationUpdate error: ' + err.message);
      return { ok: false, error: err.message };
    }
  }

  /**
   * Join a room
   * payload: { room: string }  e.g. room = 'deliveryPerson:abc' ou 'manager'
   */
  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() payload: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { room } = payload;
    if (!room) return;
    client.join(room);
    // this.logger.setLog(`Socket ${client.id} joined room ${room}`);
    return { ok: true };
  }

  /**
   * Leave a room
   * payload: { room: string }
   */
  @SubscribeMessage('leave')
  handleLeave(
    @MessageBody() payload: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { room } = payload;
    if (!room) return;
    client.leave(room);
    // this.logger.setLog(`Socket ${client.id} left room ${room}`);
    return { ok: true };
  }

  // --- Server -> Client helper emits (used pelo DeliveryService) ---

  // helper para definir nome de room padrão
  roomForDeliveryPerson(deliveryPersonId: string) {
    return `deliveryPerson:${deliveryPersonId}`;
  }

  // broadcast global (managers listening)
  broadcastLocationUpdate(deliveryPersonId: string, lat: number, lng: number) {
    const data = {
      deliveryPersonId,
      lat,
      lng,
      updatedAt: new Date().toISOString(),
    };
    // global
    this.server.emit('location:update', data);
    // room specific
    this.server
      .to(this.roomForDeliveryPerson(deliveryPersonId))
      .emit('location:update', data);
    /*  this.logger.setLog(
      `broadcastLocationUpdate -> ${deliveryPersonId} ${lat},${lng}`,
    ); */
  }

  broadcastRouteCreated(route: any) {
    this.server.emit('route:created', route);
    // notify specific delivery person room if needed
    const dpRoom = this.roomForDeliveryPerson(route.deliveryPersonId);
    this.server.to(dpRoom).emit('route:created', route);
    //  this.logger.setLog(`broadcastRouteCreated -> route ${route.id}`);
  }

  broadcastRouteStarted(route: any) {
    this.server.emit('route:started', route);
    const dpRoom = this.roomForDeliveryPerson(route.deliveryPersonId);
    this.server.to(dpRoom).emit('route:started', route);
    //this.logger.setLog(`broadcastRouteStarted -> route ${route.id}`);
  }

  broadcastStopUpdated(routeId: string, stopId: string, stop?: any) {
    const payload = { routeId, stopId, stop: stop ?? null };
    this.server.emit('stop:updated', payload);
    // also emit to route room (optional)
    this.server.to(`route:${routeId}`).emit('stop:updated', payload);
    /* this.logger.setLog(
      `broadcastStopUpdated -> route ${routeId} stop ${stopId}`,
    ); */
  }

  broadcastRouteFinished(routeId: string) {
    this.server.emit('route:finished', { routeId });
    this.server.to(`route:${routeId}`).emit('route:finished', { routeId });
    //this.logger.setLog(`broadcastRouteFinished -> route ${routeId}`);
  }

  // emitir mensagem privada para entregador (room)
  sendToDeliveryPerson(deliveryPersonId: string, event: string, payload: any) {
    const room = this.roomForDeliveryPerson(deliveryPersonId);
    this.server.to(room).emit(event, payload);
    /*  this.logger.setLog(
      `sendToDeliveryPerson -> ${deliveryPersonId} event ${event}`,
    ); */
  }
}
