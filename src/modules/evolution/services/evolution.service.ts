import { Injectable } from '@nestjs/common';
import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { IEvolutionApiSendResponse, IIsWhatsappResponse } from 'src/common/interfaces';
import { N8nService } from 'src/modules/n8n/services/n8n.service';

@Injectable()
export class EvolutionService extends BaseService {
  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
    private readonly n8nService: N8nService,
  ) {
    super(configService, loggerService, prismaService);
    this.logger.log(`EvolutionService iniciado. Modo Proxy N8N Ativo.`);
  }

  // --- Métodos de Utilidade e Requisição ---

  private formatPhone(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  }

  // --- MÉTODOS DE COMUNICAÇÃO PROXY VIA N8N ---

  // --- MÉTODOS PÚBLICOS DE COMUNICAÇÃO RAW (HTTP) ---

  public async sendText(
    phone: string,
    text: string,
  ): Promise<IEvolutionApiSendResponse> {
    const formattedPhone = this.formatPhone(phone);
    this.logger.log(`Proxy (TEXT): sendText para: ${formattedPhone} via N8N`);
    
    return await this.n8nService.dispatchEvent('EVOLUTION_TEXT_MSG', {
      messageType: 'TEXT',
      phone: formattedPhone,
      message: text,
    });
  }

  public async sendLocation(
    phone: string,
    latitude: number,
    longitude: number,
    name: string,
    address: string,
  ): Promise<IEvolutionApiSendResponse | void> {
    try {
      const formattedPhone = this.formatPhone(phone);
      this.logger.log(`Proxy (LOCATION): sendLocation para: ${formattedPhone} via N8N`);

      return await this.n8nService.dispatchEvent('EVOLUTION_LOCATION_MSG', {
        messageType: 'LOCATION',
        phone: formattedPhone,
        latitude,
        longitude,
        locationName: name, // Custom payload
        address,
      });
    } catch (error) {
      this.logger.error(`Erro ao enviar localização (N8N Proxy): ${error.message}`);
    }
  }

  public async getInstanceStatus(): Promise<{ state: string }> {
    return { state: 'open' }; // N8n Proxy assumes handled
  }

  public async checkWhatsAppNumber(phone: string): Promise<IIsWhatsappResponse[]> {
    const formattedPhone = this.formatPhone(phone);
    this.logger.log(`Proxy (VALIDATE): Verificando validade do número: ${formattedPhone} via N8N`);

    const result = await this.n8nService.dispatchEvent('EVOLUTION_VALIDATE_NUMBER', {
      messageType: 'VALIDATE',
      phone: formattedPhone,
    });
    
    // N8N's lastNode (httpRequest) returns Arrays or Objects from Evolution API directly.
    return result as IIsWhatsappResponse[];
  }
}
