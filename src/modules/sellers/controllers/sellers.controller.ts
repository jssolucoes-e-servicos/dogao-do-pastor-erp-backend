import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaginatedQuery } from 'src/common/decorators/paginated-query.decorator';
import { IdParamDto } from 'src/common/dto/id.param.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SellerEntity } from 'src/common/entities';
import type { IPaginatedResponse, IUser } from 'src/common/interfaces';
import { CreateSellerDto } from '../dto/create-seller.dto';
import { ParamTagSellerDto } from '../dto/param-tag-seller.dto';
import { UpdateSellerDto } from '../dto/update-seller.dto';
import { SellersService } from '../services/sellers.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User } from 'src/common/decorators/user.decorator';

@Controller('sellers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SellersController {
  constructor(private readonly service: SellersService) {
    /* void */
  }

  @PaginatedQuery()
  @Roles('IT', 'ADMIN', 'FINANCE', 'MANAGER', 'LEADER')
  async list(
    @Query() query: PaginationQueryDto,
    @User() user: IUser,
  ): Promise<IPaginatedResponse<SellerEntity>> {
    return this.service.list(query, user);
  }

  @Post()
  async create(@Body() dto: CreateSellerDto) {
    const created = await this.service.create(dto);
    return created;
  }

  @Get(':id')
  async findByIdWithStats(@Param() { id }: IdParamDto) {
    return await this.service.findByIdWithStats(id);
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

  @Post('send-links-all')
  async sendLinksAll() {
    return await this.service.sendLinksAll();
  }

  @Post('send-link/:id')
  async sendLinksFor(@Param() { id }: IdParamDto) {
    return await this.service.sendLinksFor(id);
  }
}
