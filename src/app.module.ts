import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustomerAddressModule } from './modules/customer-address/customer-address.module';
import { CustomerModule } from './modules/customer/customer.module';
import { EvolutionModule } from './modules/evolution/evolution.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PreSaleItemsModule } from './modules/pre-sale-items/pre-sale-items.module';
import { PreSaleModule } from './modules/pre-sale/pre-sale.module';
import { PrismaService } from './modules/prisma/services/prisma.service';
import { SellerModule } from './modules/seller/seller.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EvolutionModule,
    CustomerModule,
    CustomerAddressModule,
    PreSaleModule,
    PreSaleItemsModule,
    PaymentModule,
    SellerModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {
  /* void */
}
