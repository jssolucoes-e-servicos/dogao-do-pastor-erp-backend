import { EvolutionNotificationsService } from '@/modules/evolution/services/evolution-notifications.service';
import { EvolutionService } from '@/modules/evolution/services/evolution.service';
import { LoggerService } from '@/modules/logger/services/logger.service';
import { PrismaService } from '@/modules/prisma/services/prisma.service';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReportsController } from './constrollers/reports.controller';
import { ReportsService } from './services/reports.service';

@Module({
  controllers: [ReportsController],
  providers: [
    ReportsService,
    PrismaService,
    LoggerService,
    ConfigService,
    EvolutionNotificationsService,
    EvolutionService,
  ],
})
export class ReportsModule {
  /* void */
}
