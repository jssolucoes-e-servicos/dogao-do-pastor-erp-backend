//ENDEREÇO/NOME DO ARQUIVO: src/modules/pre-sale/controllers/pre-sale.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { PreSaleInitRetrieveDTO } from '../dto/pre-sale-init-retrieve.dto';
import { PreSaleItemsManyCreateDTO } from '../dto/pre-sale-items-many-create.dto';
import { PreSaleItemsService } from '../services/pre-sale-items.service';

@Controller('pre-sale-items')
export class PreSaleItemsController {
  constructor(private readonly preSaleItemsService: PreSaleItemsService) {
    /* void */
  }

  @Post('inserts')
  async inserts(
    @Body() body: PreSaleItemsManyCreateDTO,
  ): Promise<PreSaleInitRetrieveDTO> {
    return await this.preSaleItemsService.inserts(body);
  }
}
