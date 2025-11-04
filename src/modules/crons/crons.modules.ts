// src/modules/payment/payment.module.ts
import { Module } from '@nestjs/common';
import { EvolutionService } from 'src/modules/evolution/services/evolution.service';
import { LoggerService } from 'src/modules/logger/services/logger.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { EvolutionModule } from '../evolution/evolution.module';
import { PaymentModule } from '../payment/payment.module';
import { PaymentTaskService } from '../payment/services/payment-task.service';
import { CronsService } from './services/crons.service';

@Module({
  imports: [EvolutionModule, PaymentModule],
  controllers: [],
  providers: [
    PrismaService,
    LoggerService,
    CronsService,
    EvolutionService,
    PaymentTaskService,
  ],
  exports: [],
})
export class CronsModule {
  /* void */
}
