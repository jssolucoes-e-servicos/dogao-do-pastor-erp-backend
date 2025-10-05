// src/modules/payment/payment.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentController } from 'src/modules/payment/controllers/payment.controller';
import { WebhookController } from 'src/modules/payment/controllers/webhook.controller';
import { PaymentTaskService } from 'src/modules/payment/services/payment-task.service';
import { PaymentService } from 'src/modules/payment/services/payment.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { LoggerService } from '../logger/services/logger.service';
import { MercadoPagoService } from './services/mercadopago.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [PaymentController, WebhookController],
  providers: [
    PrismaService,
    LoggerService,
    MercadoPagoService,
    PaymentTaskService,
    PaymentService,
  ],
  exports: [PaymentService, MercadoPagoService],
})
export class PaymentModule {
  /* void */
}
