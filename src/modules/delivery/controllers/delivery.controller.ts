import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query
} from '@nestjs/common';
import { GenerateRouteDto } from '../dto/generate-route.dto';
import { UpdateLocationDto } from '../dto/location.dto';
import { UpdateStopDto } from '../dto/update-stop.dto';
import { DeliveryService } from '../services/delivery.service';

@Controller('delivery-routes')
export class DeliveryController {
  constructor(private readonly service: DeliveryService) { }

  @Post('generate')
  async generateRoute(@Body() body: GenerateRouteDto) {
    return this.service.generateRoute(body.orderIds, body.deliveryPersonId);
  }

  @Post(':routeId/start')
  async startRoute(@Param('routeId') routeId: string) {
    return this.service.startRoute(routeId);
  }

  @Patch('stop')
  async updateStop(@Body() body: UpdateStopDto) {
    return this.service.updateStopStatus(body.stopId, body.status, body.reason);
  }

  @Patch('location')
  async updateLocation(@Body() body: UpdateLocationDto) {
    return this.service.updateLocation(
      body.deliveryPersonId,
      body.lat,
      body.lng,
    );
  }

  @Get('by-delivery-person/:deliveryPersonId')
  async getRoutesByDeliveryPerson(@Param('deliveryPersonId') id: string) {
    return this.service.getRoutesByDeliveryPerson(id);
  }

  @Get(':routeId')
  async getRoute(@Param('routeId') routeId: string) {
    return this.service.getRouteDetails(routeId);
  }

  @Get('delivery-persons')
  async listDeliveryPersons(@Query('active') active?: string) {
    const onlyActive = active === 'true' ? true : undefined;
    return this.service.listDeliveryPersons(onlyActive);
  }
}
