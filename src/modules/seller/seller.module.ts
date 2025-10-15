// src/modules/payment/payment.module.ts
import { LoggerService, PrismaService } from '@/common/helpers/importer-helper';
import { Module } from '@nestjs/common';
import { EvolutionModule } from '../evolution/evolution.module';
import { EvolutionNotificationsService } from '../evolution/services/evolution-notifications.service';
import { SellerController } from './controllers/seller.controller';
import { SellerService } from './service/seller.service';

@Module({
  imports: [EvolutionModule],
  controllers: [SellerController],
  providers: [
    PrismaService,
    LoggerService,
    SellerService,
    EvolutionNotificationsService,
  ],
  exports: [SellerService],
})
export class SellerModule {
  /* void */
}
