// src/modules/pre-sale/pre-sale.module.ts
import { OrderOnlineItemsController } from '@/modules/order-online-items/controllers/order-online-items.controller';
import { OrderOnlineItemsService } from '@/modules/order-online-items/services/order-online-items.service';
import { Module } from '@nestjs/common';
import { LoggerService } from 'src/modules/logger/services/logger.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Module({
  imports: [],
  controllers: [OrderOnlineItemsController],
  providers: [PrismaService, LoggerService, OrderOnlineItemsService],
  exports: [OrderOnlineItemsService],
})
export class OrderOnlineItemsModule {
  /* void */
}
