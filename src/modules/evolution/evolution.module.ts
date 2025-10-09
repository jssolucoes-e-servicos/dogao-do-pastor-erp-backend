// src/modules/payment/payment.module.ts
import { Module } from '@nestjs/common';
import { EvolutionController } from 'src/modules/evolution/controllers/evolution.controller';
import { EvolutionNotificationsService } from 'src/modules/evolution/services/evolution-notifications.service';
import { EvolutionService } from 'src/modules/evolution/services/evolution.service';
import { LoggerService } from 'src/modules/logger/services/logger.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Module({
  controllers: [EvolutionController],
  providers: [
    PrismaService,
    LoggerService,
    EvolutionService,
    EvolutionNotificationsService,
  ],
  exports: [EvolutionService, EvolutionNotificationsService],
})
export class EvolutionModule {
  /* void */
}
