import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query
} from '@nestjs/common';
import { PaginatedQuery } from 'src/common/decorators/paginated-query.decorator';
import { IdParamDto } from 'src/common/dto/id.param.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { OrderItemEntity } from 'src/common/entities';
import { IPaginatedResponse } from 'src/common/interfaces';
import { OrderItemsManyCreateDTO } from '../dto/order-items-many-create.dto';
import { OrdersItemsService } from '../services/orders-items.service';

@Controller('orders-items')
export class OrdersItemsController {
  constructor(private readonly service: OrdersItemsService) {
    /* void */
  }

  @PaginatedQuery()
  async list(
    @Query() query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<OrderItemEntity>> {
    return this.service.list(query);
  }

  @Post('inserts')
  async inserts(@Body() dto: OrderItemsManyCreateDTO) {
    return await this.service.inserts(dto);
  }

  @Get(':id')
  async findById(@Param() { id }: IdParamDto) {
    return await this.service.findById(id);
  }

  @Post('by-customer/:id')
  async findByOrderId(@Param() { id }: IdParamDto) {
    return await this.service.findByOrderId(id);
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
}
