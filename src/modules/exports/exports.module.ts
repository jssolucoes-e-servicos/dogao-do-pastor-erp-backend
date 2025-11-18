import { LoggerService } from '@/modules/logger/services/logger.service';
import { PrismaService } from '@/modules/prisma/services/prisma.service';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExportsController } from './constrollers/exports.controller';
import { ExportsService } from './services/exports.service';

@Module({
  controllers: [ExportsController],
  providers: [PrismaService, LoggerService, ConfigService, ExportsService],
})
export class ExportsModule {
  /* void */
}
