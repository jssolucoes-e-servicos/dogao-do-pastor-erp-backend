// src/modules/payment/services/payment-task.service.ts
import { BaseService } from '@/common/services/base.service';
import { LoggerService } from '@/modules/logger/services/logger.service';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { PaymentService } from './payment.service';

@Injectable()
export class PaymentTaskService extends BaseService {
  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    private readonly paymentService: PaymentService,
  ) {
    super(loggerService, prismaService);
  }

  // Executa a cada hora
  //@Cron('0 * * * *')
  //@Cron(CronExpression.EVERY_MINUTE)
  async handlePendingPayments() {
    this.logger.log('Verificando pagamentos pendentes...');
    const pendingOrders = await this.prisma.orderOnline.findMany({
      where: {
        paymentStatus: 'pending',
      },
    });

    for (const order of pendingOrders) {
      // Corrigido para verificar o paymentId antes de fazer a chamada à API
      if (order.paymentId) {
        const paymentDetails = await this.paymentService.getPaymentStatus(
          order.paymentId,
        );

        if (paymentDetails && paymentDetails.status !== 'pending') {
          await this.prisma.orderOnline.update({
            where: { id: order.id },
            data: {
              paymentStatus: paymentDetails.status,
            },
          });
          this.logger.log(
            `Status do pedido ${order.id} atualizado para ${paymentDetails.status}`,
          );
        }
      }
    }
    this.logger.log('Verificação de pagamentos pendentes concluída.');
  }
}
