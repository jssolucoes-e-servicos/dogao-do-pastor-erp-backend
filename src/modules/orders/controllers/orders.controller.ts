import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { PaginatedQuery } from 'src/common/decorators/paginated-query.decorator';
import { IdParamDto } from 'src/common/dto/id.param.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { OrderEntity } from 'src/common/entities';
import { IPaginatedResponse } from 'src/common/interfaces';
import { DefinePaymetnDTO } from '../dto/define-payment.dto';
import { ForDeliveryDTO } from '../dto/for-delivery.dto';
import { ForDonationDTO } from '../dto/for-donation.dto';
import { InitOrderDto } from '../dto/init-order.dto';
import { SendToAnalysisDTO } from '../dto/send-to-analysis.dto';
import { SyncCustomerDTO } from '../dto/sync-customer.dto';
import { OrdersService } from '../services/orders.service';
import { OrderIdOnly } from '../dto/order-id-only.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {
    /* void */
  }

  @PaginatedQuery()
  async list(
    @Query() query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<OrderEntity>> {
    return this.service.list(query);
  }

  @Post('init')
  async initOrder(@Body() dto: InitOrderDto) {
    return await this.service.initOrder(dto);
  }

  @Get(':id')
  async findById(@Param() { id }: IdParamDto) {
    return await this.service.findById(id);
  }

  @Post('by-customer/:id')
  async findByCustomerId(@Param() { id }: IdParamDto) {
    return await this.service.findByCustomerId(id);
  }

  @Post('by-seller/:id')
  async findBySellerId(@Param() { id }: IdParamDto) {
    return await this.service.findBySellerId(id);
  }

  @Post('by-edition/:id')
  async findByEditionId(@Param() { id }: IdParamDto) {
    return await this.service.findByEditionId(id);
  }

  @Put(':id')
  async update(@Param() { id }: IdParamDto, @Body() dto: any) {
    return await this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param() { id }: IdParamDto) {
    return await this.service.remove(id);
  }

  @Post('restore/:id')
  async restore(@Param() { id }: IdParamDto) {
    return await this.service.restore(id);
  }

  @Post('up-step/:id')
  async upStep(@Param() { id }: IdParamDto): Promise<OrderEntity> {
    return this.service.upStep(id);
  }

  @Patch(':id/sync-customer')
  async syncCustomer(
    @Param() { id }: IdParamDto,
    @Body() dto: SyncCustomerDTO,
  ) {
    return this.service.update(id, {
      customerName: dto.name,
      customerPhone: dto.phone,
    });
  }

  @Post('define-payment')
  async definePayment(@Body() dto: DefinePaymetnDTO) {
    return this.service.definePayment(dto);
  }

  @Post('set-donation')
  async setDonation(@Body() dto: ForDonationDTO) {
    return await this.service.setDonation(dto);
  }

  @Post('set-delivery')
  async setDelivery(@Body() dto: ForDeliveryDTO) {
    return await this.service.setDelivery(dto);
  }

  @Post('set-pickup')
  async setPickup(@Body() dto: OrderIdOnly) {
    return await this.service.setPickup(dto);
  }

  @Post('send-to-analysis')
  async sendToAnalysis(@Body() dto: SendToAnalysisDTO) {
    return this.service.setAnalysisStatus(dto);
  }

  @Post('change-payment-method')
  async changePaymentMethod(@Body() dto: OrderIdOnly) {
    return this.service.changePaymentMethod(dto.orderId);
  }
}
