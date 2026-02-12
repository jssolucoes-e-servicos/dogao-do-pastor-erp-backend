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
import { CustomerEntity } from 'src/common/entities';
import { IPaginatedResponse } from 'src/common/interfaces';
import { CreateCustomerDto } from 'src/modules/customers/dto/create-customer.dto';
import { FindCpfCustomerDto } from 'src/modules/customers/dto/find-cpf-customer.dto';
import { UpdateCustomerDto } from 'src/modules/customers/dto/update-customer.dto';
import { CustomersService } from 'src/modules/customers/services/customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {
    /* void */
  }

  @PaginatedQuery()
  async list(
    @Query() query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<CustomerEntity>> {
    return this.service.list(query);
  }

  @Post()
  async create(@Body() dto: CreateCustomerDto) {
    const created = await this.service.create(dto);
    return created;
  }

  @Get(':id')
  async findById(@Param() { id }: IdParamDto) {
    return await this.service.findById(id);
  }

  @Post('by-cpf')
  async findByCPF(@Body() data: FindCpfCustomerDto) {
    return await this.service.findByCPF(data);
  }

  @Put(':id')
  async update(@Param() { id }: IdParamDto, @Body() dto: UpdateCustomerDto) {
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
