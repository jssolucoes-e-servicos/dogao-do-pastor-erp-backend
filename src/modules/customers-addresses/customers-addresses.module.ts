// src/modules/cells/cells.module.ts

import { Module } from '@nestjs/common';
import {
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { CustomersAddressesController } from './controllers/customers-addresses.controller';
import { CustomersAddressesService } from './services/customers-addresses.service';

@Module({
  imports: [],
  controllers: [CustomersAddressesController],
  providers: [PrismaService, LoggerService, CustomersAddressesService],
  exports: [CustomersAddressesService],
})
export class CustomersAddressesModule {
  /* void */
}
