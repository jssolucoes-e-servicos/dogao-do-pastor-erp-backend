import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Query,
} from '@nestjs/common';
import { OnlyCPFRequestDTO } from 'src/modules/customer/dto/only-cpf-request.dto';
import { CustomerService } from 'src/modules/customer/services/customer.service';
import { CustomerCreateDTO } from '../dto/customer-create.dto';
import { CustomerRetrieve } from '../dto/customer-retrieve';

@Controller('customer')
export class CustomerController {
  constructor(private readonly service: CustomerService) {
    /* void */
  }

  @Get('search')
  async searchCustomer(
    @Query('phone') phone?: string,
    @Query('cpf') cpf?: string,
  ) {
    return this.service.searchCustomer({ phone, cpf });
  }

  @Get('count')
  async count(): Promise<{ customers: number }> {
    return await this.service.count();
  }

  @Get()
  async list(): Promise<CustomerRetrieve[]> {
    return await this.service.findAll();
  }

  @Post('find-by-cpf')
  async findByCpf(@Body() data: OnlyCPFRequestDTO) {
    const customer = await this.service.findByCpf(data);
    if (!customer) {
      throw new NotFoundException('Cliente não encontrado.');
    }
    return customer;
  }

  @Post('proccess-entry')
  async processEntry(
    @Body() data: CustomerCreateDTO,
  ): Promise<CustomerRetrieve | null> {
    const customer = await this.service.proccessCustomerEntry(data);
    return customer;
  }
}
