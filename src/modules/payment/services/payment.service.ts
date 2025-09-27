//ENDEREÇO/NOME DO ARQUIVO: src/modules/payment/services/payment.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { CardPaymentRequest, PixPaymentRequest } from '../dto/payment.dto';
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

  async createPixPayment(
    body: PixPaymentRequest,
  ): Promise<IMercadoPagoPaymentResponse> {
    try {
      this.logger.log('Iniciando criação de pagamento Pix...');
      const paymentData = {
        transaction_amount: body.transactionAmount,
        description: body.description,
        payment_method_id: 'pix',
        payer: {
          email: body.payer.email,
        },
        external_reference: body.externalReference,
        callback_url: body.callbackUrl,
      };

      const payment = await this.mercadoPagoService.createPayment(paymentData);
      this.logger.log(`Pagamento Pix criado com sucesso. ID: ${payment.id}`);
      return payment;
    } catch (error) {
      this.logger.error('Erro ao criar pagamento Pix:', error.stack);
      throw error;
    }
  }

  async createCardPayment(
    body: CardPaymentRequest,
  ): Promise<IMercadoPagoPaymentResponse> {
    try {
      this.logger.log('Iniciando criação de pagamento com cartão...');
      const paymentData = {
        token: body.token,
        description: body.description,
        installments: body.installments,
        payment_method_id: body.paymentMethodId,
        issuer_id: body.issuerId,
        payer: {
          email: body.payer.email,
        },
        transaction_amount: body.transactionAmount,
        external_reference: body.externalReference,
        callback_url: body.callbackUrl,
      };

      const payment = await this.mercadoPagoService.createPayment(paymentData);
      this.logger.log(`Pagamento com cartão criado. ID: ${payment.id}`);
      return payment;
    } catch (error) {
      this.logger.error('Erro ao criar pagamento com cartão:', error.stack);
      throw error;
    }
  }

  async getPaymentStatus(
    paymentId: string,
  ): Promise<IMercadoPagoPaymentResponse> {
    try {
      this.logger.log(`Buscando status do pagamento com ID: ${paymentId}`);
      const paymentDetails =
        await this.mercadoPagoService.getPayment(paymentId);
      this.logger.log(
        `Status do pagamento ${paymentId} é: ${paymentDetails.status}`,
      );
      return paymentDetails;
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
