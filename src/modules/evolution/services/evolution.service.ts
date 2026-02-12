import { Injectable } from '@nestjs/common';
import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { IEvolutionApiSendResponse, IIsWhatsappResponse } from 'src/common/interfaces';

@Injectable()
export class EvolutionService extends BaseService {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly instance: string;

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
  ) {
    super(configService, loggerService, prismaService);

    // Lendo configurações do ambiente
    this.baseUrl = this.configs.get<string>(
      'EVOLUTION_API_URL',
      'https://smartchat-api.jssolucoeseservicos.com.br',
    );
    this.token = this.configs.get<string>('EVOLUTION_API_TOKEN',
      'E32A02450217-4CBD-A05F-C2E76FC2385F');
    this.instance = this.configs.get<string>(
      'EVOLUTION_API_INSTANCE',
      'smartChurches',
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
  ): Promise<IEvolutionApiSendResponse> {
    const endpoint = `message/sendText/${this.instance}`;
    const formattedPhone = this.formatPhone(phone);

    const data = {
      number: formattedPhone,
      text: text,
    };
    this.logger.log(`Evolution API Call: sendText para: ${formattedPhone}`);
    return await this.makeRequest<IEvolutionApiSendResponse>(
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
  ): Promise<IEvolutionApiSendResponse | void> {
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
      return await this.makeRequest<IEvolutionApiSendResponse>(
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

  public async checkWhatsAppNumber(phone: string): Promise<IIsWhatsappResponse[]> {
    const endpoint = `chat/whatsappNumbers/${this.instance}`;
    const formattedPhone = this.formatPhone(phone);

    const data = {
      numbers: [formattedPhone],
    };

    // Mantendo 'any' aqui por não ter a tipagem exata deste retorno complexo
    return await this.makeRequest<any>(endpoint, 'POST', data);
  }
}
