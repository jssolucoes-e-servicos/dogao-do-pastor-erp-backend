import { Controller, MessageEvent, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Public } from '../auth/decorators/public.decorator';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * Canal SSE para comandos/comandas em tempo real
   */
  @Public()
  @Sse('commands')
  sendCommands(): Observable<MessageEvent> {
    return this.eventsService.getCommandEvents() as Observable<MessageEvent>;
  }
}
