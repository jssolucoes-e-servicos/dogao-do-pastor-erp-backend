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
  private readonly activeAllCrons: boolean = false;

  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    configService: ConfigService,
    private readonly evolutionService: EvolutionService,
    private readonly paymentTaskService: PaymentTaskService,
  ) {
    super(loggerService, prismaService, configService);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processWhatsappMessages() {
    if (this.activeAllCrons) {
      const penddings = await this.prisma.whatsappQueue.findMany();
      if (penddings) {
        //  await this.evolutionService.sendText();
      }
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async processMercadoPagoPendingPayments() {
    if (this.activeAllCrons) {
      await this.paymentTaskService.handlePendingPayments();
    }
  }
}
