//ENDEREÇO/NOME DO ARQUIVO: src/modules/payment/services/payment.service.ts
import { BaseService } from '@/common/services/base.service';
import { LoggerService } from '@/modules/logger/services/logger.service';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { IMercadoPagoPaymentResponse } from '../interfaces/mercadopago.interface';

@Injectable()
export class PaymentService extends BaseService {
  constructor(loggerService: LoggerService, prismaService: PrismaService) {
    super(loggerService, prismaService);
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
        `Erro ao buscar status do pagamento ${paymentId}: ${error.stack}`,
      );
      throw error;
    }
  }

  async processWebhook(paymentId: string) {
    console.log('paymentId: ', paymentId);
    const payment = await this.getPaymentStatus(paymentId);
    console.log('payment: ', payment);
    if (payment) {
      const orderToUpdate = await this.prisma.orderOnline.findFirst({
        where: {
          paymentId: payment.id.toString(),
        },
      });

      if (orderToUpdate) {
        await this.prisma.orderOnline.update({
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
