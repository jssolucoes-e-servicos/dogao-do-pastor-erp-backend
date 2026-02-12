// src/modules/cells/cells.module.ts

import { Module } from '@nestjs/common';
import {
    LoggerService,
    PrismaService,
} from 'src/common/helpers/importer.helper';
import { SellersController } from './controllers/sellers.controller';
import { SellersService } from './services/sellers.service';

@Module({
  imports: [],
  controllers: [SellersController],
  providers: [PrismaService, LoggerService, SellersService],
  exports: [SellersService],
})
export class SellersModule {
  /* void */
}
