import { Module } from '@nestjs/common';
import { PrismaService } from 'src/common/helpers/importer.helper';
import { PurchasingController } from './controllers/purchasing.controller';
import { PurchasingService } from './services/purchasing.service';

@Module({
  controllers: [PurchasingController],
  providers: [PrismaService, PurchasingService],
  exports: [PurchasingService],
})
export class PurchasingModule {}
