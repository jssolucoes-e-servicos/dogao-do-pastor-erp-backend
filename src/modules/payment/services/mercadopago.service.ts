//ENDEREÇO/NOME DO ARQUIVO: src/modules/payment/services/mercadopago.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { IMercadoPagoPaymentResponse } from '../interfaces/mercadopago.interface';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly baseUrl = 'https://api.mercadopago.com/v1/payments';
  private readonly accessToken: string;

  constructor() {
    this.accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN!;
    if (!this.accessToken) {
      this.logger.error(
        'MERCADO_PAGO_ACCESS_TOKEN não está definido. Verifique seu arquivo .env',
      );
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN não está definido.');
    }
  }

  async createPayment(paymentData: any): Promise<IMercadoPagoPaymentResponse> {
    this.logger.log('Iniciando requisição real para a API do Mercado Pago...');
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error(
          `Erro da API do Mercado Pago: ${JSON.stringify(errorData)}`,
        );
        throw new Error(
          `Falha ao criar o pagamento: ${response.status} - ${response.statusText}`,
        );
      }

      const data: IMercadoPagoPaymentResponse = await response.json();
      this.logger.log(`Pagamento criado com sucesso. ID: ${data.id}`);
      return data;
    } catch (error) {
      this.logger.error('Erro na chamada à API do Mercado Pago', error.stack);
      throw error;
    }
  }

  async getPayment(paymentId: string): Promise<IMercadoPagoPaymentResponse> {
    this.logger.log(
      `Consultando status do pagamento ${paymentId} na API do Mercado Pago...`,
    );
    try {
      const response = await fetch(`${this.baseUrl}/${paymentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error(
          `Erro da API do Mercado Pago ao buscar pagamento: ${JSON.stringify(errorData)}`,
        );
        throw new Error(
          `Falha ao buscar o pagamento: ${response.status} - ${response.statusText}`,
        );
      }

      const data: IMercadoPagoPaymentResponse = await response.json();
      this.logger.log(`Status do pagamento ${data.id}: ${data.status}`);
      return data;
    } catch (error) {
      this.logger.error('Erro ao consultar a API do Mercado Pago', error.stack);
      throw error;
    }
  }
}
