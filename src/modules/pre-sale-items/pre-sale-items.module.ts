// src/modules/pre-sale/pre-sale.module.ts
import { Module } from '@nestjs/common';
import { PreSaleItemsController } from 'src/modules/pre-sale-items/controllers/pre-sale-items.controller';
import { PreSaleItemsService } from 'src/modules/pre-sale-items/services/pre-sale-items.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { LoggerService } from '../logger/services/logger.service';

@Module({
  imports: [],
  controllers: [PreSaleItemsController],
  providers: [PrismaService, LoggerService, PreSaleItemsService],
  exports: [PreSaleItemsService],
})
export class PreSaleItemsModule {
  /* void */
}
