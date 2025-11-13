// src/modules/payment/payment.module.ts
import { Module } from '@nestjs/common';
import { CronsService } from 'src/modules/crons/services/crons.service';
import { EvolutionModule } from 'src/modules/evolution/evolution.module';
import { EvolutionService } from 'src/modules/evolution/services/evolution.service';
import { LoggerService } from 'src/modules/logger/services/logger.service';
import { OrderOnlineModule } from 'src/modules/order-online/order-online.module';
import { OrderOnlinePendingService } from 'src/modules/order-online/services/orders-online-pending.service';
import { PaymentModule } from 'src/modules/payment/payment.module';
import { PaymentTaskService } from 'src/modules/payment/services/payment-task.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { ReportsService } from 'src/modules/reports/services/reports.service';

@Module({
  imports: [EvolutionModule, PaymentModule, OrderOnlineModule],
  controllers: [],
  providers: [
    PrismaService,
    LoggerService,
    CronsService,
    EvolutionService,
    PaymentTaskService,
    ReportsService,
    OrderOnlinePendingService,
  ],
  exports: [],
})
export class CronsModule {
  /* void */
}
