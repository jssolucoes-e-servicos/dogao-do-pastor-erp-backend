// src/modules/pre-sale/pre-sale.module.ts
import { LoggerService, PrismaService } from '@/common/helpers/importer-helper';
import { OrderOnlineItemsController } from '@/modules/order-online-items/controllers/order-online-items.controller';
import { OrderOnlineItemsService } from '@/modules/order-online-items/services/order-online-items.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [OrderOnlineItemsController],
  providers: [PrismaService, LoggerService, OrderOnlineItemsService],
  exports: [OrderOnlineItemsService],
})
export class OrderOnlineItemsModule {
  /* void */
}
