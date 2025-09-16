import { Module } from '@nestjs/common';
import { MercadoPagoService } from 'src/modules/mercadopago/services/mercadopago.service';

@Module({
  providers: [MercadoPagoService],
  exports: [MercadoPagoService],
})
export class MercadoPagoModule {
  /* void */
}
