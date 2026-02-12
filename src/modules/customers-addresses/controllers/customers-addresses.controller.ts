import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { PaginatedQuery } from 'src/common/decorators/paginated-query.decorator';
import { IdParamDto } from 'src/common/dto/id.param.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { CustomerAddressEntity } from 'src/common/entities';
import { IPaginatedResponse } from 'src/common/interfaces';
import { CreateCustomerAddressDto } from 'src/modules/customers-addresses/dto/create-customer-address.dto';
import { FindByCepDto } from 'src/modules/customers-addresses/dto/find-by-cep.dto';
import { FindByCustomerDto } from 'src/modules/customers-addresses/dto/find-by-customer.dto';
import { UpdateCustomerAddressDto } from 'src/modules/customers-addresses/dto/update-customer-address.dto';
import { CustomersAddressesService } from 'src/modules/customers-addresses/services/customers-addresses.service';

@Controller('customers-addresses')
export class CustomersAddressesController {
  constructor(private readonly service: CustomersAddressesService) {
    /* void */
  }

  @PaginatedQuery()
  async list(
    @Query() query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<CustomerAddressEntity>> {
    return this.service.list(query);
  }

  @Post()
  async create(@Body() dto: CreateCustomerAddressDto) {
    const created = await this.service.create(dto);
    return created;
  }

  @Get(':id')
  async findById(@Param() { id }: IdParamDto) {
    return await this.service.findById(id);
  }

  @Post('by-cep')
  async findByCep(@Body() data: FindByCepDto) {
    return await this.service.findByCEP(data);
  }

  @Post('by-customer')
  async findByCustomer(@Body() data: FindByCustomerDto) {
    return await this.service.findByCustomer(data);
  }

  @Put(':id')
  async update(
    @Param() { id }: IdParamDto,
    @Body() dto: UpdateCustomerAddressDto,
  ) {
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
