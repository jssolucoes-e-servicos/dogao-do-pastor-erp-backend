import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
} from '@nestjs/common';
import { MercadoPagoService } from '../services/mercadopago.service';

@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly mpService: MercadoPagoService) { }

  /**
   * Gera pagamento PIX para um preorder.
   * Body: { preorderId: string }
   */
  @Post('pix')
  async payWithPix(@Body() body: { preorderId?: string }) {
    if (!body?.preorderId) {
      throw new HttpException(
        'preorderId é obrigatório',
        HttpStatus.BAD_REQUEST,
      );
    }

    this.logger.log(
      `Solicitado pagamento PIX para preorder ${body.preorderId}`,
    );
    return this.mpService.processPixPayment(body.preorderId);
  }

  /**
   * Processa pagamento com cartão (checkout transparente).
   * Path: /payments/:preOrderId/card
   * Body esperado:
   * {
   *   card: { token: string; installments?: number },
   *   payer?: { name?: string; email?: string }  // payer info optional; service monta fallback
   * }
   */
  @Post(':preOrderId/card')
  async payWithCard(
    @Param('preOrderId') preOrderId: string,
    @Body()
    body: {
      card?: { token?: string; installments?: number };
      payer?: { name?: string; email?: string };
    },
  ) {
    if (!preOrderId) {
      throw new HttpException(
        'preOrderId é obrigatório',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!body?.card?.token) {
      throw new HttpException(
        'Token do cartão é obrigatório',
        HttpStatus.BAD_REQUEST,
      );
    }

    this.logger.log(`Solicitado pagamento CARD para preorder ${preOrderId}`);
    return this.mpService.processCardPayment(preOrderId, {
      token: body.card.token,
      installments: body.card.installments ?? 1,
      payer: body.payer,
    });
  }
}
