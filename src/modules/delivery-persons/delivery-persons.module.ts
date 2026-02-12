// src/modules/cells/cells.module.ts

import { Module } from '@nestjs/common';
import {
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { DeliveryPersonsController } from './controllers/delivery-persons.controller';
import { DeliveryPersonsService } from './services/delivery-persons.service';

@Module({
  imports: [],
  controllers: [DeliveryPersonsController],
  providers: [PrismaService, LoggerService, DeliveryPersonsService],
  exports: [DeliveryPersonsService],
})
export class DeliveryPersonsModule {
  /* void */
}
