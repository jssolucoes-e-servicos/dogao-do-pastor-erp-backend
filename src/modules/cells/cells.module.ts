// src/modules/cells/cells.module.ts

import { Module } from '@nestjs/common';
import {
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { CellsController } from './controllers/cells.controller';
import { CellsService } from './services/cells.service';

@Module({
  imports: [],
  controllers: [CellsController],
  providers: [PrismaService, LoggerService, CellsService],
  exports: [CellsService],
})
export class CellsModule {
  /* void */
}
