import { Injectable } from '@nestjs/common';
import { BaseService, ConfigService, LoggerService, PrismaService } from 'src/common/helpers/importer.helper';

@Injectable()
export class N8nService extends BaseService {
  private readonly webhookUrl: string;
  private readonly evoInstance: string;
  private readonly evoToken: string;

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
  ) {
    super(configService, loggerService, prismaService);
    this.webhookUrl = this.configs.get<string>('N8N_WEBHOOK_URL', '');
    this.evoInstance = this.configs.get<string>('EVOLUTION_API_INSTANCE', '');
    this.evoToken = this.configs.get<string>('EVOLUTION_API_TOKEN', '');
  }

  async dispatchEvent(event: string, payload: any): Promise<any> {
    if (!this.webhookUrl) {
      this.logger.warn(`N8N_WEBHOOK_URL não configurada. Evento [${event}] ignorado.`);
      return null;
    }

    try {
      this.logger.log(`Disparando evento [${event}] para o N8N: ${this.webhookUrl}`);
      
      let finalPhone = payload.adminPhone || payload.phone || payload.number || '';
      if (finalPhone) {
        finalPhone = finalPhone.replace(/\D/g, '');
        if (!finalPhone.startsWith('55')) {
          finalPhone = `55${finalPhone}`;
        }
      }

      // --- DEVELOPMENT SANDBOX MODE ---
      // Se estivermos em dev e tivermos um número de testes, substituímos o destinatário real!
      const isDev = this.configs.get<string>('NODE_ENV') === 'development';
      const testPhone = this.configs.get<string>('WHATSAPP_TEST_NUMBER');
      
      if (isDev && testPhone) {
        this.logger.warn(`[SANDBOX MODE] Interceptando disparo! MSG redirecionada de (${finalPhone}) para seu número de testes: ${testPhone}`);
        finalPhone = testPhone;
      }

      // Aguardando explicitamente a resposta para podermos estourar o erro caso o N8N esteja desligado
      const res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Event-Type': event,
        },
        body: JSON.stringify({
          event,
          evoInstance: this.evoInstance,
          evoToken: this.evoToken,
          timestamp: new Date().toISOString(),
          data: {
            ...payload, // Spread no resto do payload ANTES para evitar sobrescrever as chaves abaixo
            messageType: payload.messageType || 'TEXT',
            phone: finalPhone,
            message: payload.message || payload.text || '',
            media: payload.media || null,
            fileName: payload.fileName || null,
          },
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`N8N respondeu com status ${res.status}: ${res.statusText}. Corpo: ${errBody}`);
      }
      
      return await res.json();
    } catch (error: any) {
      this.logger.error(`Erro ao montar evento webhook n8n [${event}]: ${error.message}`);
      throw error; // Repassa o erro para que quem chamou possa tratar (ex: mandar pro Discord)
    }
  }
}
