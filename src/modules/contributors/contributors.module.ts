// src/modules/contributors/contributors.module.ts

import { Module } from '@nestjs/common';
import {
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { UploadsService } from '../uploads/services/uploads.service';
import { UploadsModule } from '../uploads/uploads.module';
import { ContributorsController } from './controllers/contributors.controller';
import { ContributorsService } from './services/contributors.service';

@Module({
  imports: [UploadsModule],
  controllers: [ContributorsController],
  providers: [
    PrismaService,
    LoggerService,
    ContributorsService,
    UploadsService,
  ],
  exports: [ContributorsService],
})
export class ContributorsModule {
  /* void */
}
