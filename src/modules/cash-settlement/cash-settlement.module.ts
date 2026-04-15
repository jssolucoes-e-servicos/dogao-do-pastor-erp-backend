import { Module } from '@nestjs/common';
import { PrismaService } from 'src/common/helpers/importer.helper';
import { CashSettlementController } from './controllers/cash-settlement.controller';
import { CashSettlementService } from './services/cash-settlement.service';

@Module({
  controllers: [CashSettlementController],
  providers: [PrismaService, CashSettlementService],
  exports: [CashSettlementService],
})
export class CashSettlementModule {}
