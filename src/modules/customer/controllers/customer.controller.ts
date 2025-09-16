import { Body, Controller, Post } from '@nestjs/common';
import { OnlyCPFRequestDTO } from 'src/modules/customer/dto/only-cpf-request.dto';
import { CustomerService } from 'src/modules/customer/services/customer.service';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {
    /* void */
  }

  @Post('find-by-cpf')
  async findByCpf(@Body() data: OnlyCPFRequestDTO) {
    const customer = this.customerService.findByCpf(data);
    return customer;
  }
}
