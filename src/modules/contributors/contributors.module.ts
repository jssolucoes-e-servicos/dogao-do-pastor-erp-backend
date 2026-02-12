// src/modules/contributors/contributors.module.ts

import { Module } from '@nestjs/common';
import {
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { ContributorsController } from './controllers/contributors.controller';
import { ContributorsService } from './services/contributors.service';

@Module({
  imports: [],
  controllers: [ContributorsController],
  providers: [PrismaService, LoggerService, ContributorsService],
  exports: [ContributorsService],
})
export class ContributorsModule {
  /* void */
}
