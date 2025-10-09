import { Body, Controller, Get, NotFoundException, Post } from '@nestjs/common';
import { OnlyCPFRequestDTO } from 'src/modules/customer/dto/only-cpf-request.dto';
import { CustomerService } from 'src/modules/customer/services/customer.service';
import { CustomerCreateDTO } from '../dto/customer-create.dto';
import { CustomerRetrieve } from '../dto/customer-retrieve';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {
    /* void */
  }

  @Get('count')
  async count(): Promise<{ customers: number }> {
    return await this.customerService.count();
  }

  @Get()
  async list(): Promise<CustomerRetrieve[]> {
    return await this.customerService.findAll();
  }

  @Post('find-by-cpf')
  async findByCpf(@Body() data: OnlyCPFRequestDTO) {
    const customer = await this.customerService.findByCpf(data);
    if (!customer) {
      throw new NotFoundException('Cliente não encontrado.');
    }
    return customer;
  }

  @Post('proccess-entry')
  async processEntry(
    @Body() data: CustomerCreateDTO,
  ): Promise<CustomerRetrieve | null> {
    const customer = await this.customerService.proccessCustomerEntry(data);
    return customer;
  }
}
