import { Module } from '@nestjs/common';
import { MercadoPagoModule } from 'src/modules/mercadopago/mercadopago.module';
import { MercadoPagoService } from 'src/modules/mercadopago/services/mercadopago.service';
import { PreSaleController } from 'src/modules/pre-sale/controllers/pre-sale.controller';
import { PreSaleService } from 'src/modules/pre-sale/services/pre-sale.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Module({
  imports: [MercadoPagoModule],
  controllers: [PreSaleController],
  providers: [PrismaService, PreSaleService, MercadoPagoService],
})
export class PreSaleModule {
  /* void */
}
