// src/modules/payment/payment.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { LoggerService } from '../logger/services/logger.service';
import { SellerController } from './controllers/seller.controller';
import { SellerService } from './service/seller.service';

@Module({
  imports: [],
  controllers: [SellerController],
  providers: [PrismaService, LoggerService, SellerService],
  exports: [SellerService],
})
export class SellerModule {
  /* void */
}
