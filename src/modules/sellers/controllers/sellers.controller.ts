import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { PaginatedQuery } from 'src/common/decorators/paginated-query.decorator';
import { IdParamDto } from 'src/common/dto/id.param.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SellerEntity } from 'src/common/entities';
import { IPaginatedResponse } from 'src/common/interfaces';
import { CreateSellerDto } from '../dto/create-seller.dto';
import { ParamTagSellerDto } from '../dto/param-tag-seller.dto';
import { UpdateSellerDto } from '../dto/update-seller.dto';
import { SellersService } from '../services/sellers.service';

@Controller('sellers')
export class SellersController {
  constructor(private readonly service: SellersService) {
    /* void */
  }

  @PaginatedQuery()
  async list(
    @Query() query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<SellerEntity>> {
    return this.service.list(query);
  }

  @Post()
  async create(@Body() dto: CreateSellerDto) {
    const created = await this.service.create(dto);
    return created;
  }

  @Get(':id')
  async findById(@Param() { id }: IdParamDto) {
    return await this.service.findById(id);
  }

  @Post('by-cell/:id')
  async findByLeaderId(@Param() { id }: IdParamDto) {
    return await this.service.findByCellId(id);
  }

  @Post('by-tag/:tag')
  async findByTag(@Param() { tag }: ParamTagSellerDto) {
    return await this.service.findByTag(tag);
  }

  @Post('by-contributor/:id')
  async findByContributorId(@Param() { id }: IdParamDto) {
    return await this.service.findByContributorId(id);
  }

  @Put(':id')
  async update(@Param() { id }: IdParamDto, @Body() dto: UpdateSellerDto) {
    return await this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param() { id }: IdParamDto) {
    return await this.service.remove(id);
  }

  @Post('restore/:id')
  async restore(@Param() { id }: IdParamDto) {
    return await this.service.restore(id);
  }
}
