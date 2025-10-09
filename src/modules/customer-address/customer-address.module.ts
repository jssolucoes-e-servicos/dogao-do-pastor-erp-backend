import { LoggerService, PrismaService } from '@/common/helpers/importer-helper';
import { Module } from '@nestjs/common';
import { CustomerAddressController } from 'src/modules/customer-address/controllers/customer-address.controller';
import { CustomerAddressService } from 'src/modules/customer-address/services/customer-address.service';
import { CustomerModule } from 'src/modules/customer/customer.module';
import { CustomerService } from 'src/modules/customer/services/customer.service';

@Module({
  imports: [CustomerModule],
  controllers: [CustomerAddressController],
  providers: [
    PrismaService,
    LoggerService,
    CustomerService,
    CustomerAddressService,
  ],
  exports: [CustomerAddressService],
})
export class CustomerAddressModule {
  /* void */
}
