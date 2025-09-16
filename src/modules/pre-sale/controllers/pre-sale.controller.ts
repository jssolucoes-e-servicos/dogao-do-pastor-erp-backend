import { Body, Controller, Post } from '@nestjs/common';
import { PreSaleService } from 'src/modules/pre-sale/services/pre-sale.service';
import { PreSaleCreateDTO } from '../dto/pre-sale-create.dto';

@Controller('pre-sale')
export class PreSaleController {
  constructor(private readonly preSaleService: PreSaleService) {
    /* void */
  }

  @Post()
  async createPreSaleOrder(@Body() body: PreSaleCreateDTO) {
    return this.preSaleService.processOrder(body);
  }
}
