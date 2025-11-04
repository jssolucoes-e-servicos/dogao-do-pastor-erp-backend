import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from '@/common/helpers/importer-helper';
import { PaymentTaskService } from '@/modules/payment/services/payment-task.service';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EvolutionService } from 'src/modules/evolution/services/evolution.service';

@Injectable()
export class CronsService extends BaseService {
  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    configService: ConfigService,
    private readonly evolutionService: EvolutionService,
    private readonly paymentTaskService: PaymentTaskService,
  ) {
    super(loggerService, prismaService, configService);
  }

/*   //@Cron(CronExpression.EVERY_MINUTE)
  async processWhatsappMessages() {
    const penddings = await this.prisma.whatsappQueue.findMany();
    if (penddings) {
      //await this.evolutionService.sendText();
    }
  }
 */
  @Cron(CronExpression.EVERY_MINUTE)
  async processPendingPayments() {
    try {
      const pendents = await this.prisma.orderOnline.findMany({
        where: { paymentStatus: 'pending', status: 'pending_payment' },
      });

      if (pendents.length === 0) {
        return;
      }

      this.logger.log(`Encontrados ${pendents.length} pagamentos pendentes.`);

      for (const order of pendents) {
        const paymentId = order.paymentId;

        if (!paymentId) {
          this.logger.warn(
            `Pedido ${order.id} não possui mercadopagoPaymentId. Pulando.`,
          );
          continue;
        }
        //processamento
        await this.paymentTaskService.handlePendingPayments(order, paymentId);
      }

      this.logger.log(
        `Processamento finalizado, todos os pedidos fora conferidos`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao buscar pagamentos pendentes no banco de dados: ${error}`,
      );
    }
  }
}
