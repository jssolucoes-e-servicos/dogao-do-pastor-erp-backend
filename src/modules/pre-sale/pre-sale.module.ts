// src/modules/pre-sale/pre-sale.module.ts
import { Module } from '@nestjs/common';
import { PaymentModule } from 'src/modules/payment/payment.module';
import { PreSaleController } from 'src/modules/pre-sale/controllers/pre-sale.controller';
import { PreSaleService } from 'src/modules/pre-sale/services/pre-sale.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { CustomerModule } from '../customer/customer.module';
import { CustomerService } from '../customer/services/customer.service';
import { PaymentService } from '../payment/services/payment.service';

@Module({
  imports: [PaymentModule, CustomerModule],
  controllers: [PreSaleController],
  providers: [PrismaService, PreSaleService, PaymentService, CustomerService],
  exports: [PreSaleService],
})
export class PreSaleModule {
  /* void */
}
