// src/modules/payment/services/payment-task.service.ts
import { OrderStatsEnum, PreOrderStepEnum } from '@/common/enums';
import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from '@/common/helpers/importer-helper';
import { Injectable } from '@nestjs/common';
import { OrderOnline } from '@prisma/client';
import { MercadoPagoService } from './mercadopago.service';
import { PaymentService } from './payment.service';

@Injectable()
export class PaymentTaskService extends BaseService {
  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    configService: ConfigService,
    private readonly paymentService: PaymentService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {
    super(loggerService, prismaService, configService);
  }

  async handlePendingPayments(order: OrderOnline, paymentId: string) {
    this.logger.log(
      `Iniciando verificação de pagamentos pendentes do pedido: ${order.id}`,
    );

    try {
      const mpPayment =
        await this.mercadoPagoService.getPaymentStatus(paymentId);

      if (!mpPayment) {
        // O erro já foi logado no MercadoPagoService, então continuamos.
        return;
      }

      const mpPaymentStatus = mpPayment.status;
      //const mpPaymentStatusDetail = mpPayment.status_detail;

      let newPaymentStatus: string;
      let newOrderStatus = order.status;
      let newStep = order.step;

      switch (mpPaymentStatus) {
        case 'approved':
          {
            newPaymentStatus = 'approved';
            newOrderStatus = OrderStatsEnum.payd;
            newStep = PreOrderStepEnum.tanks;
          }
          break;
        case 'pending':
          {
            newPaymentStatus = 'pending';
            newOrderStatus = OrderStatsEnum.pending_payment;
            newStep = order.step;
          }
          break;
        case 'rejected':
        case 'cancelled':
          {
            newPaymentStatus = 'rejected';
            newOrderStatus = OrderStatsEnum.pending_payment;
            newStep = PreOrderStepEnum.payment;
          }
          break;
        default:
          newPaymentStatus = 'unknown';
          this.logger.warn(
            `Status do Mercado Pago desconhecido: ${mpPaymentStatus} para a ordem ${order.id}`,
          );
      }

      if (
        order.paymentStatus !== newPaymentStatus &&
        newPaymentStatus !== 'unknown' &&
        newPaymentStatus !== 'pending'
      ) {
        await this.prisma.orderOnline.update({
          where: { id: order.id },
          data: {
            paymentStatus: newPaymentStatus,
            status: newOrderStatus,
            step: newStep,
          },
        });
        this.logger.log(
          `Ordem ${order.id} atualizada para o status: ${newPaymentStatus}`,
        );
      }
    } catch (error) {
      this.logger.error(`Erro ao processar pagamento pendente: ${error}`);
    }
  }
}
