// src/modules/payment/payment.module.ts
import { Module } from '@nestjs/common';
import { LoggerService, PrismaService } from 'src/common/helpers/importer.helper';
import { EvolutionModule } from 'src/modules/evolution/evolution.module';
import { PaymentsController } from 'src/modules/payments/controllers/payments.controller';
import { OrdersNotificationsService } from '../evolution/services/notifications/orders-notifications.service';
import { MpPaymentsService } from './services/mercadopago/mp-payments.service';
import { PaymentsService } from './services/payments.service';

@Module({
  imports: [EvolutionModule],
  controllers: [PaymentsController],
  providers: [
    PrismaService,
    LoggerService,
    OrdersNotificationsService,
    MpPaymentsService,
    PaymentsService,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {
  /* void */
}
