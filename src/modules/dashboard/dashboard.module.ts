// src/modules/payment/payment.module.ts
import { LoggerService, PrismaService } from '@/common/helpers/importer-helper';
import { Module } from '@nestjs/common';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './services/dashboard.service';

@Module({
  imports: [],
  controllers: [DashboardController],
  providers: [PrismaService, LoggerService, DashboardService],
  exports: [],
})
export class DashboardModule {
  /* void */
}
