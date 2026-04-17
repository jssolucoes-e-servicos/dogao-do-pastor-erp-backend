import { Module } from '@nestjs/common';
import { EvolutionService } from 'src/modules/evolution/services/evolution.service';
import { LoggerService } from 'src/modules/logger/services/logger.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { EvolutionController } from './controllers/evolution.controller';
import { OrdersNotificationsService } from './services/notifications/orders-notifications.service';
import { PartnersNotificationsService } from './services/notifications/partners-notifications.service';
import { SellersNotificationsService } from './services/notifications/sellers-notifications.service';
import { CustomersNotificationsService } from './services/notifications/customers-notifications.service';
import { ContributorsNotificationsService } from './services/notifications/contributors-notifications.service';
import { N8nModule } from 'src/modules/n8n/n8n.module';

@Module({
  imports: [N8nModule],
  controllers: [EvolutionController],
  providers: [
    PrismaService,
    LoggerService,
    EvolutionService,
    OrdersNotificationsService,
    PartnersNotificationsService,
    SellersNotificationsService,
    CustomersNotificationsService,
    ContributorsNotificationsService,
  ],
  exports: [
    EvolutionService,
    OrdersNotificationsService,
    PartnersNotificationsService,
    SellersNotificationsService,
    CustomersNotificationsService,
    ContributorsNotificationsService,
  ],
})
export class EvolutionModule {
  /* void */
}
