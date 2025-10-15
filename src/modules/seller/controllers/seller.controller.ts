import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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

  @Get('show/:id')
  async findById(
    @Param('id') id: string,
  ): Promise<SellerRetrieveWithCellDTO | null> {
    const seller = await this.sellerService.findById(id);
    return seller;
  }

  @Get('for-network/:networkId')
  async listforNetwork(
    @Param('networkId') networkId: string,
  ): Promise<SellerRetrieveWithCellDTO[]> {
    const sellers = await this.sellerService.listforNetwork(networkId);
    return sellers;
  }

  @Get('for-cell/:cellId')
  async listforCell(
    @Param('cellId') cellId: string,
  ): Promise<SellerRetrieveWithCellDTO[]> {
    const sellers = await this.sellerService.listforCell(cellId);
    return sellers;
  }

  @Get()
  async listAll(): Promise<SellerRetrieveWithCellDTO[]> {
    return await this.sellerService.listAll();
  }
  @Post('send-create-notification/:sellerId')
  async sendCreateNotification(
    @Param('sellerId') sellerId: string,
  ): Promise<boolean> {
    return await this.sellerService.sendCreateNotification(sellerId);
  }
}
