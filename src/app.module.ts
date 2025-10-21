import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CellsNetworksModule } from './modules/cells-networks/cells-networks.model';
import { CellsModule } from './modules/cells/cells.model';
import { CronsModule } from './modules/crons/crons.modules';
import { CustomerAddressModule } from './modules/customer-address/customer-address.module';
import { CustomerModule } from './modules/customer/customer.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
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
    CronsModule,
    CellsModule,
    CellsNetworksModule,
    DashboardModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {
  /* void */
}
