import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from '@/common/helpers/importer-helper';
import { Injectable } from '@nestjs/common';
import { EvolutionApiSendResponse } from 'src/common/interfaces';

@Injectable()
export class EvolutionService extends BaseService {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly instance: string;

  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    configService: ConfigService,
  ) {
    super(loggerService, prismaService, configService);

    // Lendo configurações do ambiente
    this.baseUrl = this.configs.get<string>(
      'EVOLUTION_API_URL',
      'https://whats-api.default.com.br',
    );
    this.token = this.configs.get<string>('EVOLUTION_TOKEN', 'DEFAULT_TOKEN');
    this.instance = this.configs.get<string>(
      'EVOLUTION_INSTANCE',
      'DEFAULT_INSTANCE',
    );

    this.logger.log(
      `EvolutionService (API Infra) iniciado. Base URL: ${this.baseUrl}`,
    );
  }

  // --- Métodos de Utilidade e Requisição ---

  private formatPhone(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    // Garante o formato 55DDD9XXXXXXXX
    return cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  }

  // Método genérico para requisições, que retorna o tipo T
  private async makeRequest<T>(
    endpoint: string,
    method = 'GET',
    data?: any,
  ): Promise<T> {
    const url = `${this.baseUrl}/${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        // Usando o token no header 'apikey' conforme o seu código
        apikey: this.token,
      },
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        this.logger.error(
          `Evolution API HTTP Error on ${endpoint}: ${result.message || 'Unknown error'}`,
        );
        throw new Error(
          `Evolution API Error: ${result.message || 'Unknown error'}`,
        );
      }
      // Retorna o resultado com o tipo esperado
      return result as T;
    } catch (error) {
      this.logger.error(
        `Evolution API Request Failed on ${endpoint}: ${error.message}`,
      );
      throw error;
    }
  }

  // --- MÉTODOS PÚBLICOS DE COMUNICAÇÃO RAW (HTTP) ---

  // Tipado com a interface EvolutionApiSendResponse
  public async sendText(
    phone: string,
    text: string,
  ): Promise<EvolutionApiSendResponse> {
    const endpoint = `message/sendText/${this.instance}`;
    const formattedPhone = this.formatPhone(phone);

    const data = {
      number: formattedPhone,
      textMessage: { text: text },
      options: { delay: 1200, presence: 'composing' },
    };
    this.logger.log(`Evolution API Call: sendText para: ${formattedPhone}`);
    return await this.makeRequest<EvolutionApiSendResponse>(
      endpoint,
      'POST',
      data,
    );
  }

  public async sendLocation(
    phone: string,
    latitude: number,
    longitude: number,
    name: string,
    address: string,
  ): Promise<EvolutionApiSendResponse | void> {
    try {
      const endpoint = `message/sendLocation/${this.instance}`;
      const formattedPhone = this.formatPhone(phone);

      const data = {
        number: formattedPhone,
        locationMessage: {
          name,
          address,
          latitude,
          longitude,
        },
      };

      this.logger.log(`API Call: sendLocation para: ${formattedPhone}`);
      return await this.makeRequest<EvolutionApiSendResponse>(
        endpoint,
        'POST',
        data,
      );
    } catch (error) {
      // Loga o erro, mas o método retorna void (ou Promise<void>) em caso de falha silenciosa
      this.logger.error(`Erro ao enviar localização (API): ${error.message}`);
    }
  }

  public async getInstanceStatus(): Promise<{ state: string }> {
    const endpoint = `instance/connectionState/${this.instance}`;
    // Retorno tipado como objeto simples com 'state'
    return await this.makeRequest<{ state: string }>(endpoint, 'GET');
  }

  public async checkWhatsAppNumber(phone: string): Promise<any> {
    const endpoint = `chat/whatsappNumbers/${this.instance}`;
    const formattedPhone = this.formatPhone(phone);

    const data = {
      numbers: [formattedPhone],
    };

    // Mantendo 'any' aqui por não ter a tipagem exata deste retorno complexo
    return await this.makeRequest<any>(endpoint, 'POST', data);
  }
}
