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
import { PaginatedQuery } from 'src/common/decorators';
import { IdParamDto } from 'src/common/dto/id.param.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { RoleEntity } from 'src/common/entities';
import { IPaginatedResponse } from 'src/common/interfaces';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { RolesService } from '../services/roles.service';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @PaginatedQuery()
  async list(
    @Query() query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<RoleEntity>> {
    return this.service.paginate(query);
  }

  @Post()
  async create(@Body() dto: CreateRoleDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  async findById(@Param() { id }: IdParamDto) {
    return this.service.findById(id);
  }

  @Put(':id')
  async update(@Param() { id }: IdParamDto, @Body() dto: UpdateRoleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param() { id }: IdParamDto) {
    return this.service.softDelete({ id });
  }

  @Post(':id/permissions/:moduleId')
  async setRolePermission(
    @Param('id') id: string,
    @Param('moduleId') moduleId: string,
    @Body()
    permissions: {
      access?: boolean;
      create?: boolean;
      update?: boolean;
      delete?: boolean;
      report?: boolean;
    },
  ) {
    return await this.service.setRolePermission(id, moduleId, permissions);
  }
}
