// src/modules/payment/payment.module.ts
import { LoggerService, PrismaService } from '@/common/helpers/importer-helper';
import { Module } from '@nestjs/common';
import { DeliveryModule } from '../delivery/delivery.module';
import { DeliveryGateway } from '../delivery/gateways/delivery.gateway';
import { DeliveryPersonController } from './controllers/delivery-person.controller';
import { DeliveryPersonService } from './services/delivery-person.service';

@Module({
  imports: [DeliveryModule],
  controllers: [DeliveryPersonController],
  providers: [
    PrismaService,
    LoggerService,
    DeliveryPersonService,
    DeliveryGateway,
  ],
  exports: [],
})
export class DeliveryPersonModule {
  /* void */
}
