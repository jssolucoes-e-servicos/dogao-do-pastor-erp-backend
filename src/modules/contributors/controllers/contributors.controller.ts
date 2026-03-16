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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { FormDataRequest } from 'nestjs-form-data';

import { PaginatedQuery } from 'src/common/decorators';
import { IdParamDto } from 'src/common/dto/id.param.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { UsernameParamDto } from 'src/common/dto/username.dto';
import { ContributorEntity } from 'src/common/entities';
import { IPaginatedResponse } from 'src/common/interfaces';
import { CreateContributorDto } from 'src/modules/contributors/dto/create-contributor.dto';
import { UpdateContributorDto } from 'src/modules/contributors/dto/update-contributor.dto';
import { ContributorsService } from 'src/modules/contributors/services/contributors.service';
import { UploadPhotoDto } from '../dto/upload-photo.dto';

@Controller('contributors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('IT', 'ADMIN')
export class ContributorsController {
  constructor(private readonly service: ContributorsService) {
    /* void */
  }

  @PaginatedQuery()
  async list(
    @Query() query: PaginationQueryDto,
    @User() user: any,
  ): Promise<IPaginatedResponse<ContributorEntity>> {
    return this.service.list(query, user);
  }

  @Post()
  async create(@Body() dto: CreateContributorDto) {
    const created = await this.service.create(dto);
    return {
      ...created,
      password: undefined,
    };
  }

  @Get('show/:id')
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

  @Post(':id/photo')
  @FormDataRequest() // Necessário para processar multipart/form-data
  async uploadPhoto(
    @Param() { id }: IdParamDto,
    @Body() { photo }: UploadPhotoDto,
  ) {
    return await this.service.uploadPhoto(id, photo);
  }
}
