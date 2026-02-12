// src/modules/contributors/contributors.module.ts

import { Module } from '@nestjs/common';
import {
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { CellsNetworksController } from './controllers/cells-networks.controller';
import { CellsNetworksService } from './services/cells-networks.service';

@Module({
  imports: [],
  controllers: [CellsNetworksController],
  providers: [PrismaService, LoggerService, CellsNetworksService],
  exports: [CellsNetworksService],
})
export class CellsNetworksModule {
  /* void */
}
