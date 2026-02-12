// src/modules/upload/upload.module.ts

import { Module } from '@nestjs/common';
import {
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { UploadsController } from './controllers/uploads.controller';
import { MinioService } from './services/minio.service';
import { UploadsService } from './services/uploads.service';

@Module({
  imports: [],
  controllers: [UploadsController],
  providers: [
    PrismaService,
    LoggerService,
    ConfigService,
    UploadsService,
    MinioService,
  ],
  exports: [UploadsService, MinioService],
})
export class UploadsModule {
  /* void */
}
