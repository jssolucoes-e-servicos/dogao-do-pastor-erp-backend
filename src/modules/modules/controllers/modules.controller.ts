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
import { ModuleEntity } from 'src/common/entities/module.entity';
import { IPaginatedResponse } from 'src/common/interfaces';
import { CreateModuleDto } from '../dto/create-module.dto';
import { UpdateModuleDto } from '../dto/update-module.dto';
import { ModulesService } from '../services/modules.service';

@Controller('modules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('IT', 'ADMIN')
export class ModulesController {
  constructor(private readonly service: ModulesService) {}

  @PaginatedQuery()
  async list(
    @Query() query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<ModuleEntity>> {
    return this.service.paginate(query);
  }

  @Get('all')
  async findAll() {
    return this.service.findAll();
  }

  @Post()
  async create(@Body() dto: CreateModuleDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  async findById(@Param() { id }: IdParamDto) {
    return this.service.findById(id);
  }

  @Put(':id')
  async update(@Param() { id }: IdParamDto, @Body() dto: UpdateModuleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param() { id }: IdParamDto) {
    return this.service.softDelete({ id });
  }
}
