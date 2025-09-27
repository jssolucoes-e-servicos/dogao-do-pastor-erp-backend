import { Body, Controller, Post } from '@nestjs/common';
import { SellerCreateDTO } from '../dto/seller-create.dto';
import { SellerFindByTagDTO } from '../dto/seller-find-by-tag.dto';
import { SellerRetrieveWithCellDTO } from '../dto/seller-retrieve.dto';
import { SellerService } from '../service/seller.service';

@Controller('sellers')
export class SellerController {
  constructor(private readonly sellerService: SellerService) {
    /* void */
  }

  @Post()
  async create(@Body() data: SellerCreateDTO) {
    const seller = await this.sellerService.create(data);
    return seller;
  }

  @Post('find-by-tag')
  async findByTag(
    @Body() data: SellerFindByTagDTO,
  ): Promise<SellerRetrieveWithCellDTO | null> {
    const seller = await this.sellerService.findByTag(data);
    return seller;
  }
}
