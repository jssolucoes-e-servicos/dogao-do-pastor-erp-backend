// src/modules/payment/payment.module.ts
import { Module } from '@nestjs/common';
import { EvolutionService } from 'src/modules/evolution/services/evolution.service';
import { LoggerService } from 'src/modules/logger/services/logger.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { EvolutionController } from './controllers/evolution.controller';
import { OrdersNotificationsService } from './services/notifications/orders-notifications.service';
import { PartnersNotificationsService } from './services/notifications/partners-notifications.service';

@Module({
  controllers: [EvolutionController],
  providers: [
    PrismaService,
    LoggerService,
    EvolutionService,
    OrdersNotificationsService,
    PartnersNotificationsService,
  ],
  exports: [EvolutionService, OrdersNotificationsService],
})
export class EvolutionModule {
  /* void */
}
