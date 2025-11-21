import { LoggerService, PrismaService } from '@/common/helpers/importer-helper';
import { Module } from '@nestjs/common';
import { CustomerController } from 'src/modules/customer/controllers/customer.controller';
import { CustomerService } from 'src/modules/customer/services/customer.service';

@Module({
  imports: [],
  controllers: [CustomerController],
  providers: [PrismaService, LoggerService, CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {
  /* void */
}
