//ENDEREÇO/NOME DO ARQUIVO: src/modules/payment/controllers/webhook.controller.ts
import { Controller, Get, Req } from '@nestjs/common';

import type { Request } from 'express';
import { PaymentService } from '../services/payment.service';

interface WebhookQuery {
  type: string;
  data: {
    id: string;
  };
}

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly paymentService: PaymentService) {
    /* void */
  }

  @Get('mercadopago')
  async handleWebhook(@Req() request: Request) {
    const query = request.query as unknown as WebhookQuery;
    if (query.type === 'payment') {
      await this.paymentService.processWebhook(query.data.id);
    }
  }
}
