// src/modules/payment/services/payment-task.service.ts
import { OrderStatsEnum, PreOrderStepEnum } from '@/common/enums';
import { BaseService } from '@/common/services/base.service';
import { LoggerService } from '@/modules/logger/services/logger.service';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { MercadoPagoService } from './mercadopago.service';
import { PaymentService } from './payment.service';

@Injectable()
export class PaymentTaskService extends BaseService {
  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {
    super(loggerService, prismaService);
  }

  //@Cron('*/20 * * * *') // Executa a cada 20 minutos
  @Cron(CronExpression.EVERY_MINUTE)
  async handlePendingPayments() {
    this.logger.log('Iniciando verificação de pagamentos pendentes...');

    try {
      const pendents = await this.prisma.orderOnline.findMany({
        where: { paymentStatus: 'pending' },
      });

      if (pendents.length === 0) {
        this.logger.log('Nenhum pagamento pendente encontrado.');
        return;
      }

      this.logger.log(`Encontrados ${pendents.length} pagamentos pendentes.`);

      for (const order of pendents) {
        const paymentId = order.paymentId;

        if (!paymentId) {
          this.logger.warn(
            `Ordem ${order.id} não possui mercadopagoPaymentId. Pulando.`,
          );
          continue;
        }

        const mpPayment =
          await this.mercadoPagoService.getPaymentStatus(paymentId);

        if (!mpPayment) {
          // O erro já foi logado no MercadoPagoService, então continuamos.
          continue;
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
      }
    } catch (error) {
      this.logger.error(
        `Erro ao buscar pagamentos pendentes no banco de dados: ${error}`,
      );
    }

    this.logger.log('Verificação de pagamentos pendentes finalizada.');
  }
}
