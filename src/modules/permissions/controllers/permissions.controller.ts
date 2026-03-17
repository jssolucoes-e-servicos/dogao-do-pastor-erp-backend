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
import { PaginatedQuery } from 'src/common/decorators';
import { IdParamDto } from 'src/common/dto/id.param.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PermissionEntity } from 'src/common/entities';
import { IPaginatedResponse } from 'src/common/interfaces';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { PermissionsService } from '../services/permissions.service';

@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('IT', 'ADMIN')
export class PermissionsController {
  constructor(private readonly service: PermissionsService) {}

  @PaginatedQuery()
  async list(
    @Query() query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<PermissionEntity>> {
    return this.service.paginate(query);
  }

  @Post()
  async create(@Body() dto: CreatePermissionDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  async findById(@Param() { id }: IdParamDto) {
    return this.service.findById(id);
  }

  @Put(':id')
  async update(@Param() { id }: IdParamDto, @Body() dto: UpdatePermissionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param() { id }: IdParamDto) {
    return this.service.softDelete({ id });
  }
}
