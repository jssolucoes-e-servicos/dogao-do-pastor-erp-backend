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

import { PaginatedQuery } from 'src/common/decorators';
import { IdParamDto } from 'src/common/dto/id.param.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { EditionEntity } from 'src/common/entities';
import { IPaginatedResponse } from 'src/common/interfaces';
import { EditionResponseType } from 'src/common/types/edition-response.type';
import { CreateEditionDto } from '../dto/create-edition.dto';
import { UpdateEditionDto } from '../dto/update-edition.dto';
import { EditionsService } from '../services/editions.service';

@Controller('editions')
export class EditionsController {
  constructor(private readonly service: EditionsService) {
    /* void */
  }

  @Get('get-active')
  async getActiveEdition(): Promise<EditionResponseType> {
    return await this.service.getActiveEdition();
  }

  @PaginatedQuery()
  async list(
    @Query() query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<EditionEntity>> {
    return await this.service.list(query);
  }

  @Post()
  async create(@Body() dto: CreateEditionDto) {
    return await this.service.create(dto);
  }

  @Get(':id')
  async findById(@Param() { id }: IdParamDto) {
    return await this.service.findById(id);
  }

  @Put(':id')
  async update(@Param() { id }: IdParamDto, @Body() dto: UpdateEditionDto) {
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
