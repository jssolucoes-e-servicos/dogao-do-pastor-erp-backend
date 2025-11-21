//ENDEREÇO/NOME DO ARQUIVO: src/modules/pre-sale/controllers/pre-sale.controller.ts
import { CustomerRetrieve } from '@/modules/customer/dto/customer-retrieve';
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiParam } from '@nestjs/swagger';
import { OrderOnlineFirstCreateDTO } from 'src/modules/order-online/dto/order-online-first-create.dto';
import { OrderOnlineFullRetrieveDTO } from 'src/modules/order-online/dto/order-online-full-retrieve.dto';
import { OrderOnlineInitRetrieveDTO } from 'src/modules/order-online/dto/order-online-init-retrieve.dto';
import { OrderOnlineSetAddressDTO } from 'src/modules/order-online/dto/order-online-set-address.dto';
import { OrderOnlineService } from 'src/modules/order-online/services/order-online.service';
import { CounterRetrieveDTO } from '../dto/counter-retrieve,dto';
import { OrderOnlineWithCustomerItemsAddressDTO } from '../dto/order-online-with-customer-items-address.dto';

@Controller('order-online')
export class OrderOnlineController {
  constructor(private readonly service: OrderOnlineService) {
    /* void */
  }

  @Post('start')
  async start(@Body() body: OrderOnlineFirstCreateDTO): Promise<{
    presale: OrderOnlineInitRetrieveDTO;
    customer: CustomerRetrieve | null;
  }> {
    return await this.service.start(body);
  }

  @Get('show/:id')
  async findById(
    @Param('id') id: string,
  ): Promise<OrderOnlineFullRetrieveDTO | null> {
    return await this.service.findById(id);
  }

  @Post('in-analisys')
  async getInAnalisys(): Promise<
    OrderOnlineWithCustomerItemsAddressDTO[] | null
  > {
    return await this.service.getInAnalisys();
  }

  @Post('payds-counter')
  async getPaydsCounter(): Promise<CounterRetrieveDTO[]> {
    return await this.service.getPaydsCounter();
  }

  @Post('change-step')
  async chageStep(
    @Body() data: { preorderId: string; step: string },
  ): Promise<OrderOnlineFullRetrieveDTO> {
    return await this.service.changeStep(data);
  }

  @Post('set-address')
  async setAddress(
    @Body() body: OrderOnlineSetAddressDTO,
  ): Promise<OrderOnlineFullRetrieveDTO> {
    return await this.service.setAddress(body);
  }

  @Post('set-selivery-option')
  async setDeliveryOption(
    @Body() data: { preorderId: string; deliveryOption: string },
  ): Promise<OrderOnlineFullRetrieveDTO> {
    return await this.service.setDeliveryOption(data);
  }

  @Post('set-analysis')
  async setAnalysis(
    @Body()
    data: {
      preorderId: string;
      deliveryAddressId: string;
      distance: string;
      deliveryTime: string;
      addressInline: string;
    },
  ): Promise<OrderOnlineFullRetrieveDTO> {
    return await this.service.setAnalysis(data);
  }

  @Get('dogs-paid-promo/count')
  async countPaidPromoDogs() {
    const total = await this.service.countPaidPromoDogs();
    return { total };
  }

  // 2. Endpoint para listar nomes de clientes (repetidos por dog)
  @Get('dogs-paid-promo/names')
  async getPaidPromoDogCustomerNames() {
    const names = await this.service.listPromoDogCustomerNames();
    return { names };
  }

  @Patch(':id/delivery-time')
  @ApiParam({ name: 'id', description: 'ID do pedido' })
  @ApiBody({ schema: { example: { deliveryTime: '14:00' } } })
  async updateDeliveryTime(
    @Param('id') id: string,
    @Body('deliveryTime') deliveryTime: string,
  ) {
    // Ajuste para seu formato real ('HH:mm' ou datetime completo)
    return await this.service.updateDeliveryTime(id, deliveryTime);
  }

  @Get('delivery')
  async listDeliveries() {
    return await this.service.listPaidDeliveries();
  }
}
