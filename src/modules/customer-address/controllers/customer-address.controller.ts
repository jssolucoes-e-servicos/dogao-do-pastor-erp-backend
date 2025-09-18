import { Body, Controller, Post } from '@nestjs/common';
import { CustomerAddressCreateDTO } from 'src/modules/customer-address/dto/customer-address-create.dto';
import { CustomerAddressRetrieve } from 'src/modules/customer-address/dto/customer-address-retrieve';
import { CustomerAddressService } from 'src/modules/customer-address/services/customer-address.service';

@Controller('customer-address')
export class CustomerAddressController {
  constructor(private readonly customerAddressService: CustomerAddressService) {
    /* void */
  }

  @Post('proccess-entry')
  async processEntry(
    @Body() data: CustomerAddressCreateDTO,
  ): Promise<CustomerAddressRetrieve> {
    const address =
      await this.customerAddressService.proccessAddressEntry(data);
    return address;
  }
}
