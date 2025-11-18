import { EvolutionNotificationsService } from '@/modules/evolution/services/evolution-notifications.service';
import { EvolutionService } from '@/modules/evolution/services/evolution.service';
import { LoggerService } from '@/modules/logger/services/logger.service';
import { PrismaService } from '@/modules/prisma/services/prisma.service';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CustomerModule } from '../customer/customer.module';
import { CustomerService } from '../customer/services/customer.service';
import { OrderOnlineModule } from '../order-online/order-online.module';
import { OrderOnlineService } from '../order-online/services/order-online.service';
import { ReportsController } from './constrollers/reports.controller';
import { OrderReportService } from './services/order-report.service';
import { ReportsService } from './services/reports.service';

@Module({
  imports: [OrderOnlineModule, CustomerModule],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    OrderReportService,
    PrismaService,
    LoggerService,
    ConfigService,
    EvolutionNotificationsService,
    EvolutionService,
    OrderOnlineService,
    CustomerService,
  ],
})
export class ReportsModule {
  /* void */
}
