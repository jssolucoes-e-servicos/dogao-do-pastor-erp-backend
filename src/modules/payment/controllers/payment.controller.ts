// src/modules/payment/controllers/payment.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import type {
  CardPaymentRequest,
  PixPaymentRequest,
} from 'src/modules/payment/dto/payment.dto';
import { PaymentService } from 'src/modules/payment/services/payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {
    /* void */
  }

  @Post('pix')
  async createPixPayment(@Body() body: PixPaymentRequest) {
    return this.paymentService.createPixPayment(body);
  }

  @Post('card')
  async createCardPayment(@Body() body: CardPaymentRequest) {
    return this.paymentService.createCardPayment(body);
  }
}
