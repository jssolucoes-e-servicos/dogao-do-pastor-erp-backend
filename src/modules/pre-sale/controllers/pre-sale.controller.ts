//ENDEREÇO/NOME DO ARQUIVO: src/modules/pre-sale/controllers/pre-sale.controller.ts
import { CustomerRetrieve } from '@/modules/customer/dto/customer-retrieve';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PreSaleFirstCreateDTO } from '../dto/pre-sale-first-create.dto';
import { PreSaleFullRetrieveDTO } from '../dto/pre-sale-full-retrieve.dto';
import { PreSaleInitRetrieveDTO } from '../dto/pre-sale-init-retrieve.dto';
import { PreSaleSetAddressDTO } from '../dto/pre-sale-set-address.dto';
import { PreSaleService } from '../services/pre-sale.service';

@Controller('pre-sale')
export class PreSaleController {
  constructor(private readonly preSaleService: PreSaleService) {
    /* void */
  }

  @Post('start')
  async start(@Body() body: PreSaleFirstCreateDTO): Promise<{
    presale: PreSaleInitRetrieveDTO;
    customer: CustomerRetrieve | null;
  }> {
    return await this.preSaleService.start(body);
  }

  @Get(':id')
  async findById(
    @Param('id') id: string,
  ): Promise<PreSaleFullRetrieveDTO | null> {
    return await this.preSaleService.findById(id);
  }

  @Post('change-step')
  async chageStep(
    @Body() data: { preorderId: string; step: string },
  ): Promise<PreSaleFullRetrieveDTO> {
    return await this.preSaleService.changeStep(data);
  }

  @Post('set-address')
  async setAddress(
    @Body() body: PreSaleSetAddressDTO,
  ): Promise<PreSaleFullRetrieveDTO> {
    return await this.preSaleService.setAddress(body);
  }

  @Post('set-selivery-option')
  async setDeliveryOption(
    @Body() data: { preorderId: string; deliveryOption: string },
  ): Promise<PreSaleFullRetrieveDTO> {
    return await this.preSaleService.setDeliveryOption(data);
  }
}
