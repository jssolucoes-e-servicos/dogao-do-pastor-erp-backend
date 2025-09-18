import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustomerAddressModule } from './modules/customer-address/customer-address.module';
import { CustomerModule } from './modules/customer/customer.module';
import { MercadoPagoModule } from './modules/mercadopago/mercadopago.module';
import { PreSaleModule } from './modules/pre-sale/pre-sale.module';
import { PrismaService } from './modules/prisma/services/prisma.service';
import { WebhooksModule } from './modules/webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CustomerModule,
    CustomerAddressModule,
    PreSaleModule,
    WebhooksModule,
    MercadoPagoModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {
  /* void */
}
