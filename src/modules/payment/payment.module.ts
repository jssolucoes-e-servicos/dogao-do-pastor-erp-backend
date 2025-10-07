// src/modules/payment/payment.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EvolutionModule } from 'src/modules/evolution/evolution.module';
import { EvolutionNotificationsService } from 'src/modules/evolution/services/evolution-notifications.service';
import { LoggerService } from 'src/modules/logger/services/logger.service';
import { PaymentController } from 'src/modules/payment/controllers/payment.controller';
import { WebhookController } from 'src/modules/payment/controllers/webhook.controller';
import { PaymentTaskService } from 'src/modules/payment/services/payment-task.service';
import { PaymentService } from 'src/modules/payment/services/payment.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { MercadoPagoService } from './services/mercadopago.service';

@Module({
  imports: [EvolutionModule, ScheduleModule.forRoot()],
  controllers: [PaymentController, WebhookController],
  providers: [
    PrismaService,
    LoggerService,
    EvolutionNotificationsService,
    MercadoPagoService,
    PaymentTaskService,
    PaymentService,
  ],
  exports: [PaymentService, MercadoPagoService],
})
export class PaymentModule {
  /* void */
}
