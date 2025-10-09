// src/modules/payment/payment.module.ts
import { LoggerService, PrismaService } from '@/common/helpers/importer-helper';
import { Module } from '@nestjs/common';
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
