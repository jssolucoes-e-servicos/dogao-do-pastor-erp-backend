import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustomerAddressModule } from './modules/customer-address/customer-address.module';
import { CustomerModule } from './modules/customer/customer.module';
import { EvolutionModule } from './modules/evolution/evolution.module';
import { OrderOnlineItemsModule } from './modules/order-online-items/order-online-items.module';
import { OrderOnlineModule } from './modules/order-online/order-online.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PrismaService } from './modules/prisma/services/prisma.service';
import { SellerModule } from './modules/seller/seller.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EvolutionModule,
    CustomerModule,
    CustomerAddressModule,
    OrderOnlineModule,
    OrderOnlineItemsModule,
    PaymentModule,
    SellerModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {
  /* void */
}
