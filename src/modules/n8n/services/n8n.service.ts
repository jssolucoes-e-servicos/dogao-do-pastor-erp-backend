import { Injectable } from '@nestjs/common';
import { BaseService, ConfigService, LoggerService, PrismaService } from 'src/common/helpers/importer.helper';

@Injectable()
export class N8nService extends BaseService {
  private readonly webhookUrl: string;

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
  ) {
    super(configService, loggerService, prismaService);
    this.webhookUrl = this.configs.get<string>('N8N_WEBHOOK_URL', '');
  }

  async dispatchEvent(event: string, payload: any): Promise<void> {
    if (!this.webhookUrl) {
      this.logger.warn(`N8N_WEBHOOK_URL não configurada. Evento [${event}] ignorado.`);
      return;
    }

    try {
      this.logger.log(`Disparando evento [${event}] para o N8N: ${this.webhookUrl}`);
      
      // Enviando o webhook assincronamente sem bloquear (fire and forget)
      fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Event-Type': event,
        },
        body: JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          data: payload,
        }),
      }).catch((err) => {
         this.logger.error(`Erro assíncrono ao disparar webhook para n8n: ${err.message}`);
      });
      
    } catch (error: any) {
      this.logger.error(`Erro ao montar evento webhook n8n [${event}]: ${error.message}`);
    }
  }
}
