import { Module } from '@nestjs/common';
import { PrismaService } from 'src/common/helpers/importer.helper';
import { StockController } from './controllers/stock.controller';
import { StockService } from './services/stock.service';

@Module({
  controllers: [StockController],
  providers: [PrismaService, StockService],
  exports: [StockService],
})
export class StockModule {}
