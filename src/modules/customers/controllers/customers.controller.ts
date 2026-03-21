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
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
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
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly service: CustomersService) {
    /* void */
  }

  @PaginatedQuery()
  @Roles('IT', 'ADMIN', 'FINANCE', 'RECEPTION')
  async list(
    @Query() query: PaginationQueryDto,
    @User() user: any,
  ): Promise<IPaginatedResponse<CustomerEntity>> {
    return this.service.list(query, user);
  }

  @Post()
  @Public()
  async create(@Body() dto: CreateCustomerDto) {
    const created = await this.service.create(dto);
    return created;
  }

  @Get('find/:id')
  async findById(@Param() { id }: IdParamDto) {
    return await this.service.findById(id);
  }

  @Post('by-cpf')
  @Public()
  async findByCPF(@Body() data: FindCpfCustomerDto) {
    return await this.service.findByCPF(data);
  }

  @Put(':id')
  @Public()
  async update(@Param() { id }: IdParamDto, @Body() dto: UpdateCustomerDto) {
    return await this.service.update(id, dto);
  }

  @Patch(':id')
  @Public()
  async updatePatch(
    @Param() { id }: IdParamDto,
    @Body() dto: UpdateCustomerDto,
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
