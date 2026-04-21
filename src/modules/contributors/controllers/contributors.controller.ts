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
import { SlugGuard } from '../../auth/guards/slug.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RequireSlug } from '../../auth/decorators/require-slug.decorator';
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
export class ContributorsController {
  constructor(private readonly service: ContributorsService) {}

  @PaginatedQuery()
  async list(
    @Query() query: PaginationQueryDto,
    @User() user: any,
  ): Promise<IPaginatedResponse<ContributorEntity>> {
    return this.service.list(query, user);
  }

  @Post()
  @Roles('IT', 'ADMIN')
  async create(@Body() dto: CreateContributorDto) {
    const created = await this.service.create(dto);
    return { ...created, password: undefined };
  }

  /** Líder cadastra membro na própria célula */
  @Post('invite-member')
  @UseGuards(JwtAuthGuard, SlugGuard)
  @RequireSlug('erp.my-cell', 'erp.admin')
  async inviteMember(
    @Body() { cellId: cellIdFromDto, ...dto }: CreateContributorDto & { cellId?: string },
    @User() user: any,
  ) {
    const created = await this.service.create(dto);
    // Vincula à célula do líder (ou à cellId passada)
    const cellId = cellIdFromDto ?? user.leaderCellId;
    if (cellId && created.id) {
      await this.service.addToCell(created.id, cellId);
    }
    return { ...created, password: undefined };
  }

  @Get('me')
  async getMe(@User() user: any) {
    return await this.service.findById(user.id);
  }

  @Put('me')
  async updateMe(@User() user: any, @Body() dto: UpdateContributorDto) {
    return await this.service.update(user.id, dto);
  }

  @Post('me/change-password')
  async changePassword(
    @User() user: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.service.changePassword(user.id, body.currentPassword, body.newPassword);
  }

  @Get('show/:id')
  async findById(@Param() { id }: IdParamDto) {
    return await this.service.findById(id);
  }

  @Post('auth/:username')
  @Roles('IT', 'ADMIN')
  async auth(@Param() { username }: UsernameParamDto) {
    return await this.service.findByUsername(username);
  }

  @Put(':id')
  @Roles('IT', 'ADMIN')
  async update(@Param() { id }: IdParamDto, @Body() dto: UpdateContributorDto) {
    return await this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('IT', 'ADMIN')
  async remove(@Param() { id }: IdParamDto) {
    return await this.service.remove(id);
  }

  @Post('restore/:id')
  @Roles('IT', 'ADMIN')
  async restore(@Param() { id }: IdParamDto) {
    return await this.service.restore(id);
  }

  @Post(':id/photo')
  @Roles('IT', 'ADMIN')
  @FormDataRequest()
  async uploadPhoto(
    @Param() { id }: IdParamDto,
    @Body() { photo }: UploadPhotoDto,
  ) {
    return await this.service.uploadPhoto(id, photo);
  }

  // ── Gestão de perfis e permissões (sem restrição de role por enquanto) ──

  @Post(':id/roles/:roleId')
  async linkRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return await this.service.linkRole(id, roleId);
  }

  @Delete(':id/roles/:roleId')
  async unlinkRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return await this.service.unlinkRole(id, roleId);
  }

  @Post(':id/permissions/:moduleId')
  async setPermission(
    @Param('id') id: string,
    @Param('moduleId') moduleId: string,
    @Body() permissions: {
      access?: boolean;
      create?: boolean;
      update?: boolean;
      delete?: boolean;
      report?: boolean;
    },
  ) {
    return await this.service.setIndividualPermission(id, moduleId, permissions);
  }

  @Post(':id/cells/:cellId')
  @Roles('IT', 'ADMIN')
  async linkToCell(@Param('id') id: string, @Param('cellId') cellId: string) {
    return await this.service.addToCell(id, cellId);
  }
}
