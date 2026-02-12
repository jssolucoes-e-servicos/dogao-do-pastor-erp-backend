import { Module } from '@nestjs/common';
import { EvolutionModule } from '../evolution/evolution.module';
import { EvolutionService } from '../evolution/services/evolution.service';
import { LoggerService } from '../logger/services/logger.service';
import { PrismaService } from '../prisma/services/prisma.service';
import { UploadsService } from '../uploads/services/uploads.service';
import { UploadsModule } from '../uploads/uploads.module';
import { PartnersController } from './controllers/partners.controller';
import { PartnersService } from './services/partners.service';

@Module({
  imports: [EvolutionModule, UploadsModule],
  controllers: [PartnersController],
  providers: [
    LoggerService,
    PrismaService,
    PartnersService,
    EvolutionService,
    UploadsService,
  ],
  exports: [PartnersService],
})
export class PartnersModule {
  /* void */
}
