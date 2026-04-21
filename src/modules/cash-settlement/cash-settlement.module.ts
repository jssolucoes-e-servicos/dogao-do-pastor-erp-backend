import { Module, forwardRef } from '@nestjs/common';
import { PrismaService } from 'src/common/helpers/importer.helper';
import { CashSettlementController } from './controllers/cash-settlement.controller';
import { CashSettlementService } from './services/cash-settlement.service';
import { PaymentsModule } from '../payments/payments.modules';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [forwardRef(() => PaymentsModule), UploadsModule],
  controllers: [CashSettlementController],
  providers: [PrismaService, CashSettlementService],
  exports: [CashSettlementService],
})
export class CashSettlementModule {}
