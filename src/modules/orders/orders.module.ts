// src/modules/cells/cells.module.ts

import { Module } from '@nestjs/common';
import {
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { CustomersModule } from 'src/modules/customers/customers.module';
import { CustomersService } from 'src/modules/customers/services/customers.service';
import { OrdersController } from 'src/modules/orders/controllers/orders.controller';
import { OrdersService } from 'src/modules/orders/services/orders.service';
import { SellersModule } from 'src/modules/sellers/sellers.module';
import { SellersService } from 'src/modules/sellers/services/sellers.service';
import { EvolutionModule } from 'src/modules/evolution/evolution.module';
import { EvolutionService } from 'src/modules/evolution/services/evolution.service';

@Module({
  imports: [CustomersModule, SellersModule, EvolutionModule],
  controllers: [OrdersController],
  providers: [
    PrismaService,
    LoggerService,
    OrdersService,
    CustomersService,
    SellersService,
    EvolutionService,
  ],
  exports: [OrdersService],
})
export class OrdersModule {
  /* void */
}
