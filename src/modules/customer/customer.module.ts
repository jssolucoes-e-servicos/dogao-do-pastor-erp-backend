import { LoggerService } from '@/modules/logger/services/logger.service';
import { Module } from '@nestjs/common';
import { CustomerController } from 'src/modules/customer/controllers/customer.controller';
import { CustomerService } from 'src/modules/customer/services/customer.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
@Module({
  imports: [],
  controllers: [CustomerController],
  providers: [PrismaService, LoggerService, CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {
  /* void */
}
