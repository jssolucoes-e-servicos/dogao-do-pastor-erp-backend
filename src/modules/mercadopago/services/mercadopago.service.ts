import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { MercadoPagoConfig, Preference } from 'mercadopago';

@Injectable()
export class MercadoPagoService {
  private preferences: Preference;

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
  }

  async createPreference(body: any) {
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
}
