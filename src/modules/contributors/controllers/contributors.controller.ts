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
import { UsernameParamDto } from 'src/common/dto/username.dto';
import { ContributorEntity } from 'src/common/entities';
import { IPaginatedResponse } from 'src/common/interfaces';
import { Contributor } from 'src/generated/client';
import { CreateContributorDto } from 'src/modules/contributors/dto/create-contributor.dto';
import { UpdateContributorDto } from 'src/modules/contributors/dto/update-contributor.dto';
import { ContributorsService } from 'src/modules/contributors/services/contributors.service';

@Controller('contributors')
export class ContributorsController {
  constructor(private readonly service: ContributorsService) {
    /* void */
  }

  @PaginatedQuery()
  async list(
    @Query() query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<ContributorEntity>> {
    return this.service.list(query);
  }

  @Post()
  async create(@Body() dto: CreateContributorDto) {
    const created = await this.service.create(dto);
    return {
      ...created,
      password: undefined,
    };
  }

  @Get(':id')
  async findById(@Param() { id }: IdParamDto) {
    return await this.service.findById(id);
  }

  @Post('auth/:username')
  async auth(@Param() { username }: UsernameParamDto) {
    return await this.service.findByUsername(username);
  }

  @Put(':id')
  async update(@Param() { id }: IdParamDto, @Body() dto: UpdateContributorDto) {
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
