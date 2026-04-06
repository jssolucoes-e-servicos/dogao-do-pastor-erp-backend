import { Module, forwardRef } from '@nestjs/common';
import {
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { CommandsController } from './controllers/commands.controller';
import { CommandsService } from './services/commands.service';
import { CommandsBatchService } from './services/commands-batch.service';
import { CommandsGateway } from './gateways/commands.gateway';

import { CustomersModule } from 'src/modules/customers/customers.module';
import { SellersModule } from 'src/modules/sellers/sellers.module';
import { OrdersModule } from 'src/modules/orders/orders.module';

@Module({
  imports: [CustomersModule, SellersModule, forwardRef(() => OrdersModule)],
  controllers: [CommandsController],
  providers: [PrismaService, LoggerService, ConfigService, CommandsService, CommandsBatchService, CommandsGateway],
  exports: [CommandsService, CommandsBatchService, CommandsGateway],
})
export class CommandsModule {
  /* void */
}
