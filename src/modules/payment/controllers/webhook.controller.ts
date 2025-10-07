//ENDEREÇO/NOME DO ARQUIVO: src/modules/payment/controllers/webhook.controller.ts
import { LoggerService } from '@/modules/logger/services/logger.service';
import type { RawBodyRequest } from '@nestjs/common';
import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { MercadoPagoService } from '../services/mercadopago.service';
import { PaymentService } from '../services/payment.service';
//128451348899
interface WebhookQuery {
  type: string;
  data: {
    id: string;
  };
}

@Controller('webhooks')
export class WebhookController {
  protected readonly _name: string = this.constructor.name;
  constructor(
    private readonly paymentService: PaymentService,
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly loggerService: LoggerService,
  ) {
    /* void */
  }

  @Get('mercadopago')
  async handleWebhookGet(@Req() request: Request) {
    const query = request.query as unknown as WebhookQuery;
    if (query.type === 'payment') {
      await this.paymentService.processWebhook(query.data.id);
    }
  }

  @Post('mercadopago')
  @HttpCode(200)
  async handleMercadoPagoWebhook(
    @Headers('x-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    if (!signature) {
      this.loggerService.setError(this._name, 'Cabeçalho x-signature ausente.');
      throw new BadRequestException('x-signature header is missing');
    }

    if (!req.rawBody) {
      this.loggerService.setError(
        this._name,
        'Corpo da requisição não é um raw body.',
      );
      throw new BadRequestException('Raw body is required');
    }

    try {
      const isVerified = this.mercadoPagoService.validateWebhookSignature(
        req.rawBody.toString(),
        signature,
      );

      if (!isVerified) {
        this.loggerService.setWarn(
          this._name,
          'Validação da assinatura do webhook falhou.',
        );
        throw new BadRequestException('Webhook signature validation failed');
      }

      const payload = JSON.parse(req.rawBody.toString());
      await this.mercadoPagoService.processWebhookEvent(payload);

      return { status: 'ok' };
    } catch (error) {
      this.loggerService.setError(
        this._name,
        `Erro ao processar webhook do Mercado Pago: ${error}`,
      );
      // Retorne uma resposta de erro, se necessário, mas o Mercado Pago
      // entende que qualquer resposta diferente de 200/201 é uma falha.
      throw error;
    }
  }
}
