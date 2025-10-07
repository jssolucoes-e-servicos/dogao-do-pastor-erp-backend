//ENDEREÇO/NOME DO ARQUIVO: src/modules/pre-sale/controllers/pre-sale.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { OrderOnlineInitRetrieveDTO } from 'src/modules/order-online-items/dto/order-online-init-retrieve.dto';
import { OrderOnlineItemsManyCreateDTO } from 'src/modules/order-online-items/dto/order-online-items-many-create.dto';
import { OrderOnlineItemsService } from 'src/modules/order-online-items/services/order-online-items.service';

@Controller('order-online-items')
export class OrderOnlineItemsController {
  constructor(
    private readonly orderOnlineItemsService: OrderOnlineItemsService,
  ) {
    /* void */
  }

  @Post('inserts')
  async inserts(
    @Body() body: OrderOnlineItemsManyCreateDTO,
  ): Promise<OrderOnlineInitRetrieveDTO> {
    return await this.orderOnlineItemsService.inserts(body);
  }
}
