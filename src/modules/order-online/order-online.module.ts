// src/modules/order-online/pre-sale.module.ts
import { LoggerService, PrismaService } from '@/common/helpers/importer-helper';
import { Module } from '@nestjs/common';
import { CustomerModule } from 'src/modules/customer/customer.module';
import { CustomerService } from 'src/modules/customer/services/customer.service';
import { EvolutionModule } from 'src/modules/evolution/evolution.module';
import { EvolutionNotificationsService } from 'src/modules/evolution/services/evolution-notifications.service';
import {
  OrderOnline2Controller,
  OrderOnlineController,
} from 'src/modules/order-online/controllers/order-online.controller';
import { OrderOnlineService } from 'src/modules/order-online/services/order-online.service';
import { EvolutionService } from '../evolution/services/evolution.service';
import { OrderOnlinePendingService } from './services/orders-online-pending.service';

@Module({
  imports: [CustomerModule, EvolutionModule],
  controllers: [OrderOnlineController, OrderOnline2Controller],
  providers: [
    PrismaService,
    LoggerService,
    EvolutionNotificationsService,
    EvolutionService,
    OrderOnlineService,
    CustomerService,

    OrderOnlinePendingService,
  ],
  exports: [OrderOnlineService, OrderOnlinePendingService],
})
export class OrderOnlineModule {
  /* void */
}
