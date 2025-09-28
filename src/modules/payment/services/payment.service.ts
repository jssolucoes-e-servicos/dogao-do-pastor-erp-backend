//ENDEREÇO/NOME DO ARQUIVO: src/modules/payment/services/payment.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { IMercadoPagoPaymentResponse } from '../interfaces/mercadopago.interface';
import { MercadoPagoService } from './mercadopago.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly prisma: PrismaService,
  ) {
    /* void */
  }

  async getPaymentStatus(
    paymentId: string,
  ): Promise<IMercadoPagoPaymentResponse | null> {
    try {
      this.logger.log(`Buscando status do pagamento com ID: ${paymentId}`);
      /*   const paymentDetails =
        await this.mercadoPagoService.getPayment(paymentId); */
      /*  this.logger.log(
        `Status do pagamento ${paymentId} é: ${paymentDetails.status}`,
      ); */
      return null; //paymentDetails;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar status do pagamento ${paymentId}:`,
        error.stack,
      );
      throw error;
    }
  }

  async processWebhook(paymentId: string) {
    const payment = await this.getPaymentStatus(paymentId);

    if (payment) {
      const orderToUpdate = await this.prisma.preOrder.findFirst({
        where: {
          paymentId: payment.id.toString(),
        },
      });

      if (orderToUpdate) {
        await this.prisma.preOrder.update({
          where: { id: orderToUpdate.id },
          data: { paymentStatus: payment.status },
        });
        this.logger.log(
          `Webhook processado. Status do pedido ${orderToUpdate.id} atualizado para ${payment.status}`,
        );
      }
    }
  }
}
