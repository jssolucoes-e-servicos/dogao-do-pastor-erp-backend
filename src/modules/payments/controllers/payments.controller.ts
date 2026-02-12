import { Body, Controller, Post } from '@nestjs/common';
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
}
