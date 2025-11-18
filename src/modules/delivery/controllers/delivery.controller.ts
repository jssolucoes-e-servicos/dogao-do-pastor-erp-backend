// src/modules/delivery/controllers/delivery.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { GenerateRouteDto } from '../dto/generate-route.dto';
import { UpdateStopDto } from '../dto/update-stop.dto';
import { DeliveryGateway } from '../gateways/delivery.gateway';
import { DeliveryService } from '../services/delivery.service';

@Controller('delivery-routes')
export class DeliveryController {
  constructor(
    private readonly service: DeliveryService,
    private readonly gateway: DeliveryGateway,
  ) { }

  @Post('generate')
  async generateRoute(@Body() body: GenerateRouteDto) {
    return this.service.generateRoute(body.orderIds, body.deliveryPersonId);
  }

  @Get('test-notification')
  testNotification(@Query('id') deliveryPersonId: string) {
    // Monta o payload que o front espera!
    const payload = {
      orderIds: ['TEST_ORDER_1', 'TEST_ORDER_2'],
      editionId: 'TEST_EDITION',
      message: '[TESTE] Nova rota disponível para você!',
    };
    this.gateway.sendToDeliveryPerson(deliveryPersonId, 'queue:route', payload);

    return { ok: true, sent: payload };
  }

  @Post(':routeId/start')
  async startRoute(@Param('routeId') routeId: string) {
    return this.service.startRoute(routeId);
  }

  @Patch('stop')
  async updateStop(@Body() body: UpdateStopDto) {
    return this.service.updateStopStatus(body.stopId, body.status, body.reason);
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
