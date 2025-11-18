import { BaseController } from '@/common/controllers/base.controller';
import { ConfigService, LoggerService } from '@/common/helpers/importer-helper';
import { DeliveryPersonService } from '@/modules/delivery-person/services/delivery-person.service';
import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { UpdateLocationDto } from '../dto/update-location.dto';
import { UpdateStatusDto } from '../dto/update-status.dto';

@Controller('delivery-person')
export class DeliveryPersonController extends BaseController {
  constructor(
    loggerService: LoggerService,
    configService: ConfigService,
    private readonly service: DeliveryPersonService,
  ) {
    super(loggerService, configService);
  }

  @Post('subscribe-push')
  async subscribePush(
    @Body() body: { deliveryPersonId: string; subscription: any },
  ) {
    // Salve subscription no Mongo pelo deliveryPersonId
    await this.service.savePushSubscription(
      body.deliveryPersonId,
      body.subscription,
    );
    return { ok: true };
  }

  @Get('status')
  async getDeliveryPersonStatus(@Query('id') deliveryPersonId: string) {
    const res = await this.service.getStatus(deliveryPersonId);
    return res;
  }

  @Patch('status')
  async updateDeliveryPersonStatus(@Body() body: UpdateStatusDto) {
    return this.service.setStatus(
      body.deliveryPersonId,
      body.online,
      body.inRoute,
    );
  }

  @Patch('location')
  async updateLocation(@Body() body: UpdateLocationDto) {
    return this.service.updateLocation(
      body.deliveryPersonId,
      body.lat,
      body.lng,
    );
  }
}
