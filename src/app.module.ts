import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MemoryStoredFile, NestjsFormDataModule } from 'nestjs-form-data';
import { getMailerConfig } from './common/configs/mailer.config';
import { validationSchema } from './common/configs/validation.schema';
import { CellsNetworksModule } from './modules/cells-networks/cells-networks.model';
import { CellsModule } from './modules/cells/cells.model';
import { CronsModule } from './modules/crons/crons.modules';
import { CustomerAddressModule } from './modules/customer-address/customer-address.module';
import { CustomerModule } from './modules/customer/customer.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { EvolutionModule } from './modules/evolution/evolution.module';
import { LoggerModule } from './modules/logger/logger.module';
import { OrderOnlineItemsModule } from './modules/order-online-items/order-online-items.module';
import { OrderOnlineModule } from './modules/order-online/order-online.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { PrismaService } from './modules/prisma/services/prisma.service';
import { SellerModule } from './modules/seller/seller.module';
import { UploadsModule } from './modules/uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
      // ignoreEnvFile: true // Usar em produção se as variáveis vierem diretamente do ambiente (Kubernetes/Vercel)
    }),
    NestjsFormDataModule.config({
      isGlobal: true,
      storage: MemoryStoredFile,
      fileSystemStoragePath: 'temp_uploads',
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
    MailerModule.forRootAsync({
      useFactory: getMailerConfig,
      inject: [ConfigService],
    }),
    LoggerModule,
    PrismaModule,

    UploadsModule,
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
