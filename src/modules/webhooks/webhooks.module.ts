import { Module } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { WebhooksController } from 'src/modules/webhooks/controllers/webhooks.controller';
import { WebhooksService } from 'src/modules/webhooks/services/webhooks.service';
import { MercadoPagoModule } from '../mercadopago/mercadopago.module';
import { MercadoPagoService } from '../mercadopago/services/mercadopago.service';

@Module({
  imports: [MercadoPagoModule],
  controllers: [WebhooksController],
  providers: [PrismaService, MercadoPagoService, WebhooksService],
})
export class WebhooksModule {
  /* void */
}
