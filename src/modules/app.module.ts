import { Module } from '@nestjs/common';
import { MemoryStoredFile, NestjsFormDataModule } from 'nestjs-form-data';
import { CommonModule } from 'src/common/common.module';
import { AuthModule } from './auth/auth.module';
import { CellsNetworksModule } from './cells-networks/cells-networks.module';
import { CellsModule } from './cells/cells.module';
import { ContributorsModule } from './contributors/contributors.module';
import { CustomersAddressesModule } from './customers-addresses/customers-addresses.module';
import { CustomersModule } from './customers/customers.module';
import { DeliveryPersonsModule } from './delivery-persons/delivery-persons.module';
import { EditionsModule } from './editions/editions.module';
import { OrdersItemsModule } from './orders-items/orders-items.module';
import { OrdersModule } from './orders/orders.module';
import { PartnersModule } from './partners/partners.module';
import { PaymentsModule } from './payments/payments.modules';
import { SellersModule } from './sellers/sellers.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    CommonModule,
    NestjsFormDataModule.config({
      isGlobal: true,
      storage: MemoryStoredFile,
      fileSystemStoragePath: 'temp_uploads',
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
    UploadsModule,
    AuthModule,
    EditionsModule,
    ContributorsModule,
    CustomersModule,
    CustomersAddressesModule,
    PartnersModule,
    DeliveryPersonsModule,
    CellsNetworksModule,
    CellsModule,
    SellersModule,
    OrdersModule,
    OrdersItemsModule,
    PaymentsModule,
  ],
  providers: [],
})
export class AppModule {
  /* void */
}
