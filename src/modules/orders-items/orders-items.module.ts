// src/modules/cells/cells.module.ts

import { Module } from '@nestjs/common';
import {
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { OrdersItemsService } from 'src/modules/orders-items/services/orders-items.service';
import { OrdersItemsController } from './controllers/orders-items.controller';

@Module({
  imports: [],
  controllers: [OrdersItemsController],
  providers: [PrismaService, LoggerService, OrdersItemsService],
  exports: [OrdersItemsService],
})
export class OrdersItemsModule {
  /* void */
}
