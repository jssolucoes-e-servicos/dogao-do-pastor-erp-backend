import { Module } from '@nestjs/common';
import {
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { CommandsController } from './controllers/commands.controller';
import { CommandsService } from './services/commands.service';
import { CommandsGateway } from './gateways/commands.gateway';

import { CustomersModule } from 'src/modules/customers/customers.module';
import { SellersModule } from 'src/modules/sellers/sellers.module';
import { OrdersModule } from 'src/modules/orders/orders.module';

@Module({
  imports: [CustomersModule, SellersModule, OrdersModule],
  controllers: [CommandsController],
  providers: [PrismaService, LoggerService, CommandsService, CommandsGateway],
  exports: [CommandsService, CommandsGateway],
})
export class CommandsModule {
  /* void */
}
