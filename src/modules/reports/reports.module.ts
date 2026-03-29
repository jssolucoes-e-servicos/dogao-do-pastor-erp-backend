import { Global, Module } from '@nestjs/common';
import { ConfigService, LoggerService, PrismaService } from 'src/common/helpers/importer.helper';
import { OrdersReportService } from './services/orders-report.service';
import { RankingReportService } from './services/ranking-report.service';
import { EditionReportService } from './services/edition-report.service';
import { RaffleService } from './services/raffle.service';
import { ReportsController } from './controllers/reports.controller';
import { OrdersModule } from 'src/modules/orders/orders.module';
import { N8nModule } from 'src/modules/n8n/n8n.module';
import { CommonModule } from 'src/common/common.module';

import { PaymentsModule } from 'src/modules/payments/payments.modules';
import { UploadsModule } from 'src/modules/uploads/uploads.module';

@Global()
@Module({
  imports: [OrdersModule, N8nModule, CommonModule, PaymentsModule, UploadsModule],
  controllers: [ReportsController],
  providers: [
    PrismaService,
    LoggerService,
    ConfigService,
    OrdersReportService,
    RankingReportService,
    EditionReportService,
    RaffleService,
  ],
  exports: [OrdersReportService, RankingReportService, EditionReportService, RaffleService],
})
export class ReportsModule {}
