import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, OnModuleInit } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'commands',
})
export class CommandsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('CommandsGateway');

  afterInit(server: Server) {
    this.logger.log('Commands WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Envia uma nova comanda para todos os clientes conectados (agentes de impressão)
   */
  emitNewCommand(command: any) {
    this.logger.log(`Emitindo nova comanda: ${command.sequentialId}`);
    this.server.emit('new-command', command);
  }

  /**
   * Responde a pings de clientes para validação de conexão ativa
   */
  @SubscribeMessage('ping')
  handlePing(client: Socket) {
    client.emit('pong', { timestamp: new Date().getTime() });
  }

  /**
   * Emite um heartbeat para todos os clientes a cada 30 segundos
   * Útil para monitoramento ativo e evitar timeout de proxy
   */
  onModuleInit() {
    setInterval(() => {
      if (this.server) {
        this.server.emit('heartbeat', { 
            status: 'online', 
            timestamp: new Date().getTime(),
            clientsCount: (this.server as any).engine?.clientsCount || 0
        });
      }
    }, 30000);
  }
}
