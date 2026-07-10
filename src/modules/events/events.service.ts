import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface SSEMessage {
  data: any;
  type?: string;
  id?: string;
  retry?: number;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  // Canal de eventos de novas comandas
  private readonly commandSubject = new Subject<any>();

  /**
   * Retorna um Observable que emite eventos formatados para SSE
   */
  getCommandEvents(): Observable<SSEMessage> {
    return this.commandSubject.asObservable().pipe(
      map((command) => ({
        data: command,
        type: 'new-command',
      })),
    );
  }

  /**
   * Emite uma nova comanda para todos os clientes conectados ao SSE
   * @param command Comanda gerada
   */
  emitNewCommand(command: any) {
    this.logger.log(`[SSE] Emitindo nova comanda via SSE: ${command.sequentialId}`);
    this.commandSubject.next(command);
  }
}
