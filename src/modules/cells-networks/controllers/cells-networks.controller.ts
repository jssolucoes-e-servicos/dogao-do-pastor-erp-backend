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
import { CellNetworkEntity } from 'src/common/entities';
import { IPaginatedResponse } from 'src/common/interfaces';
import { CreateCellsNetworkDto } from '../dto/create-cells-network.dto';
import { UpdateCellsNetworkDto } from '../dto/update-cells-network.dto';
import { CellsNetworksService } from '../services/cells-networks.service';

@Controller('cells-networks')
export class CellsNetworksController {
  constructor(private readonly service: CellsNetworksService) {
    /* void */
  }

  @PaginatedQuery()
  async list(
    @Query() query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<CellNetworkEntity>> {
    return this.service.list(query);
  }

  @Post()
  async create(@Body() dto: CreateCellsNetworkDto) {
    const created = await this.service.create(dto);
    return created;
  }

  @Get(':id')
  async findById(@Param() { id }: IdParamDto) {
    return await this.service.findById(id);
  }

  @Post('by-supervisor/:id')
  async fyndBySupervisorId(@Param() { id }: IdParamDto) {
    return await this.service.fyndBySupervisorId(id);
  }

  @Put(':id')
  async update(
    @Param() { id }: IdParamDto,
    @Body() dto: UpdateCellsNetworkDto,
  ) {
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
