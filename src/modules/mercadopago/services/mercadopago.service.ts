import { CreatePreferenceDto } from '@/common/interfaces/mp-types.interface';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

@Injectable()
export class MercadoPagoService {
  private preferences: Preference;
  private payments: Payment;

  constructor() {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN não está definido.');
    }

    const client = new MercadoPagoConfig({
      accessToken,
      options: { timeout: 5000 },
    });
    this.preferences = new Preference(client);
    // Inicialize a classe Payment aqui
    this.payments = new Payment(client);
  }

  async createPreference(body: CreatePreferenceDto) {
    try {
      const response = await this.preferences.create({ body });
      return response.init_point;
    } catch (error) {
      console.error('Erro ao criar preferência do Mercado Pago:', error);
      throw new HttpException(
        'Falha ao criar preferência de pagamento.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getPaymentDetails(paymentId: string) {
    try {
      const payment = await this.payments.get({ id: paymentId });
      return payment;
    } catch (error) {
      console.error(`Erro ao obter detalhes do pagamento ${paymentId}:`, error);
      throw new HttpException(
        'Falha ao obter detalhes do pagamento.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
