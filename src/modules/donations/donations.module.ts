// src/modules/editions/editions.module.ts

import { Module } from '@nestjs/common';
import {
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { DonationsController } from './controllers/dinations.controller';
import { DonationsEntryService } from './services/donations-entry.service';
import { CommandsModule } from 'src/modules/commands/commands.module';

@Module({
  imports: [CommandsModule],
  controllers: [DonationsController],
  providers: [PrismaService, LoggerService, DonationsEntryService],
  exports: [DonationsEntryService],
})
export class DonationsModule {
  /* void */
}
