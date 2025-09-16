import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { WebhooksService } from 'src/modules/webhooks/services/webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {
    /* void */
  }

  @Post('mercadopago')
  @HttpCode(200)
  async handleMercadoPagoWebhook(@Body() body: any): Promise<void> {
    await this.webhooksService.handleMercadoPagoNotification(body);
  }
}
