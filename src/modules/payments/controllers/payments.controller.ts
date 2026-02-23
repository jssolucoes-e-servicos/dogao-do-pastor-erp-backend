import { Body, Controller, Post } from '@nestjs/common';
import { GenerateOrderCardDTO } from '../dto/generate-order-card.dto';
import { GenerateOrderPixDTO } from '../dto/generate-order-pix.dto';
import { PaymentsService } from '../services/payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {
    /* void */
  }

  @Post('create-order-pix')
  async CreateOrderPIX(@Body() dto: GenerateOrderPixDTO) {
    return this.service.CreateOrderPIX(dto);
  }

  @Post('create-order-card')
  async CreateOrderCard(@Body() dto: GenerateOrderCardDTO) {
    return this.service.CreateOrderCard(dto);
  }
}
