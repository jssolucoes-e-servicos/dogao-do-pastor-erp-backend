import { Module } from '@nestjs/common';
import { MercadoPagoService } from 'src/modules/mercadopago/services/mercadopago.service';
import { PrismaService } from '../prisma/services/prisma.service';

@Module({
  providers: [PrismaService, MercadoPagoService],
  exports: [MercadoPagoService],
})
export class MercadoPagoModule {
  /* void */
}
