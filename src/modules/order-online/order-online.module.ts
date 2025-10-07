// src/modules/order-online/pre-sale.module.ts
import { Module } from '@nestjs/common';
import { CustomerModule } from 'src/modules/customer/customer.module';
import { CustomerService } from 'src/modules/customer/services/customer.service';
import { EvolutionModule } from 'src/modules/evolution/evolution.module';
import { EvolutionNotificationsService } from 'src/modules/evolution/services/evolution-notifications.service';
import { LoggerService } from 'src/modules/logger/services/logger.service';
import { OrderOnlineController } from 'src/modules/order-online/controllers/order-online.controller';
import { OrderOnlineService } from 'src/modules/order-online/services/order-online.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Module({
  imports: [CustomerModule, EvolutionModule],
  controllers: [OrderOnlineController],
  providers: [
    PrismaService,
    LoggerService,
    EvolutionNotificationsService,
    OrderOnlineService,
    CustomerService,
  ],
  exports: [OrderOnlineService],
})
export class OrderOnlineModule {
  /* void */
}
