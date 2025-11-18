//ENDEREÇO/NOME DO ARQUIVO: src/modules/pre-sale/controllers/pre-sale.controller.ts
import { CustomerRetrieve } from '@/modules/customer/dto/customer-retrieve';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { OrderOnlineFirstCreateDTO } from 'src/modules/order-online/dto/order-online-first-create.dto';
import { OrderOnlineFullRetrieveDTO } from 'src/modules/order-online/dto/order-online-full-retrieve.dto';
import { OrderOnlineInitRetrieveDTO } from 'src/modules/order-online/dto/order-online-init-retrieve.dto';
import { OrderOnlineSetAddressDTO } from 'src/modules/order-online/dto/order-online-set-address.dto';
import { OrderOnlineService } from 'src/modules/order-online/services/order-online.service';
import { CounterRetrieveDTO } from '../dto/counter-retrieve,dto';
import { OrderOnlineWithCustomerItemsAddressDTO } from '../dto/order-online-with-customer-items-address.dto';
import { OrderOnlinePendingService } from '../services/orders-online-pending.service';

@Controller('order-online')
export class OrderOnlineController {
  constructor(
    private readonly orderOnlineService: OrderOnlineService,
    private readonly orderOnlinePendingService: OrderOnlinePendingService,
  ) {
    /* void */
  }

  @Post('start')
  async start(@Body() body: OrderOnlineFirstCreateDTO): Promise<{
    presale: OrderOnlineInitRetrieveDTO;
    customer: CustomerRetrieve | null;
  }> {
    return await this.orderOnlineService.start(body);
  }

  @Get(':id')
  async findById(
    @Param('id') id: string,
  ): Promise<OrderOnlineFullRetrieveDTO | null> {
    return await this.orderOnlineService.findById(id);
  }

  @Post('in-analisys')
  async getInAnalisys(): Promise<
    OrderOnlineWithCustomerItemsAddressDTO[] | null
  > {
    return await this.orderOnlineService.getInAnalisys();
  }

  @Post('payds-counter')
  async getPaydsCounter(): Promise<CounterRetrieveDTO[]> {
    return await this.orderOnlineService.getPaydsCounter();
  }

  @Post('change-step')
  async chageStep(
    @Body() data: { preorderId: string; step: string },
  ): Promise<OrderOnlineFullRetrieveDTO> {
    return await this.orderOnlineService.changeStep(data);
  }

  @Post('set-address')
  async setAddress(
    @Body() body: OrderOnlineSetAddressDTO,
  ): Promise<OrderOnlineFullRetrieveDTO> {
    return await this.orderOnlineService.setAddress(body);
  }

  @Post('set-selivery-option')
  async setDeliveryOption(
    @Body() data: { preorderId: string; deliveryOption: string },
  ): Promise<OrderOnlineFullRetrieveDTO> {
    return await this.orderOnlineService.setDeliveryOption(data);
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
    return await this.orderOnlineService.setAnalysis(data);
  }

  @Get('dogs-paid-promo/count')
  async countPaidPromoDogs() {
    const total = await this.orderOnlineService.countPaidPromoDogs();
    return { total };
  }

  // 2. Endpoint para listar nomes de clientes (repetidos por dog)
  @Get('dogs-paid-promo/names')
  async getPaidPromoDogCustomerNames() {
    const names = await this.orderOnlineService.listPromoDogCustomerNames();
    return { names };
  }

  /* @Post('pending')
  async sendPendingPaymentReminders() {
    await this.orderOnlinePendingService.sendPendingPaymentReminders();
  } */
}
