import { Module } from '@nestjs/common';
import {
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer-helper';
import { CustomerModule } from '../customer/customer.module';
import { CustomerService } from '../customer/services/customer.service';
import { EvolutionModule } from '../evolution/evolution.module';
import { EvolutionNotificationsService } from '../evolution/services/evolution-notifications.service';
import { OrderOnlineModule } from '../order-online/order-online.module';
import { OrderOnlineService } from '../order-online/services/order-online.service';
import { CommandsController } from './controllers/commands.controller';
import { CommandsService } from './services/commands.service';

@Module({
  imports: [OrderOnlineModule, CustomerModule, EvolutionModule],
  controllers: [CommandsController],
  providers: [
    PrismaService,
    LoggerService,
    CommandsService,
    OrderOnlineService,
    CustomerService,
    EvolutionNotificationsService,
  ],
  exports: [CommandsService],
})
export class CommandsModule {
  /* void */
}
