// src/modules/editions/editions.module.ts

import { Module } from '@nestjs/common';
import {
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { EditionsController } from './controllers/editions.controller';
import { EditionsService } from './services/editions.service';

@Module({
  imports: [],
  controllers: [EditionsController],
  providers: [PrismaService, LoggerService, EditionsService],
  exports: [EditionsService],
})
export class EditionsModule {
  /* void */
}
