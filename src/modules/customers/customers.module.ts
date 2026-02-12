// src/modules/cells/cells.module.ts

import { Module } from '@nestjs/common';
import {
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { CustomersController } from './controllers/customers.controller';
import { CustomersService } from './services/customers.service';

@Module({
  imports: [],
  controllers: [CustomersController],
  providers: [PrismaService, LoggerService, CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {
  /* void */
}
