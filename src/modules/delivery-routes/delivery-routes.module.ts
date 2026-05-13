import { Module } from '@nestjs/common';
import { DeliveryRoutesController } from './controllers/delivery-routes.controller';
import { DeliveryRoutesService } from './services/delivery-routes.service';

@Module({
  controllers: [DeliveryRoutesController],
  providers: [DeliveryRoutesService],
  exports: [DeliveryRoutesService],
})
export class DeliveryRoutesModule {}
