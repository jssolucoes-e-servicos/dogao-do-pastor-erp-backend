// src/modules/payment/payment.module.ts
import { Module } from '@nestjs/common';
import {
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { EvolutionModule } from 'src/modules/evolution/evolution.module';
import { PaymentsController } from 'src/modules/payments/controllers/payments.controller';
import { OrdersNotificationsService } from '../evolution/services/notifications/orders-notifications.service';
import { OrdersModule } from '../orders/orders.module';
import { OrdersService } from '../orders/services/orders.service';
import { MpPaymentsService } from './services/mercadopago/mp-payments.service';
import { PaymentsService } from './services/payments.service';
import { PaymentsTasksService } from './services/payments-tasks.service';

import { CommandsModule } from '../commands/commands.module';

@Module({
  imports: [EvolutionModule, OrdersModule, CommandsModule],
  controllers: [PaymentsController],
  providers: [
    PrismaService,
    LoggerService,
    MpPaymentsService,
    PaymentsService,
    PaymentsTasksService,
  ],
  exports: [PaymentsService, PaymentsTasksService],
})
export class PaymentsModule {
  /* void */
}
