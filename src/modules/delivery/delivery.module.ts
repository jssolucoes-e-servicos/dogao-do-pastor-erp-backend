import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EvolutionNotificationsService } from 'src/modules/evolution/services/evolution-notifications.service';
import { LoggerService } from 'src/modules/logger/services/logger.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { EvolutionModule } from '../evolution/evolution.module';
import { DeliveryController } from './controllers/delivery.controller';
import { DeliveryGateway } from './gateways/delivery.gateway';
import { DeliveryService } from './services/delivery.service';

@Module({
  imports: [EvolutionModule],
  controllers: [DeliveryController],
  providers: [
    DeliveryService,
    DeliveryGateway,
    PrismaService,
    LoggerService,
    ConfigService,
    EvolutionNotificationsService,
  ],
  exports: [DeliveryService, DeliveryGateway],
})
export class DeliveryModule {
  /* void */
}
