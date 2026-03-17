import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'commands',
})
export class CommandsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
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
}
