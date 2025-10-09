// src/modules/payment/payment.module.ts
import { Module } from '@nestjs/common';
import { EvolutionService } from 'src/modules/evolution/services/evolution.service';
import { LoggerService } from 'src/modules/logger/services/logger.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { EvolutionModule } from '../evolution/evolution.module';
import { CronsService } from './services/crons.service';

@Module({
  imports: [EvolutionModule],
  controllers: [],
  providers: [PrismaService, LoggerService, CronsService, EvolutionService],
  exports: [],
})
export class CronsModule {
  /* void */
}
