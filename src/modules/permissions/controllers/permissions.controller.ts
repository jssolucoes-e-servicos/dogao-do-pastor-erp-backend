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
import { PermissionEntity } from 'src/common/entities';
import { IPaginatedResponse } from 'src/common/interfaces';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { PermissionsService } from '../services/permissions.service';
import { PermissionResolverService } from '../services/permission-resolver.service';
import { SystemConfigService } from 'src/modules/system/system-config.service';
import { User } from 'src/common/decorators/user.decorator';

@Controller('permissions')
@UseGuards(JwtAuthGuard)
export class PermissionsController {
  constructor(
    private readonly service: PermissionsService,
    private readonly resolver: PermissionResolverService,
    private readonly systemConfig: SystemConfigService,
  ) {}

  // ── Permissões efetivas — apenas JWT, sem verificação de role ─────────
  // Sobrescreve o @Roles da classe com lista que inclui qualquer role válida
  // O RolesGuard retorna true quando requiredRoles é null/undefined,
  // mas como a classe tem @Roles, precisamos listar todas as possíveis.
  // Alternativa: o guard verifica isMaster primeiro, então IT/ADMIN passam direto.
  // Para outros perfis, listamos as roles conhecidas.

  @Get('me')
  async getMyPermissions(@User() user: any) {
    return this.resolver.resolve(user.id || user.sub);
  }

  @Get('contributor/:id')
  async getContributorPermissions(@Param('id') id: string) {
    return this.resolver.resolve(id);
  }

  @Get('diagnostic/:id')
  async getDiagnostic(@Param('id') id: string) {
    const dynamic = await this.resolver.resolve(id);
    return { dynamic };
  }

  // ── SystemConfig ───────────────────────────────────────────────────────

  @Get('system-config/:key')
  async getSystemConfig(@Param('key') key: string) {
    const value = await this.systemConfig.get(key);
    return { key, value };
  }

  @Put('system-config/:key')
  async setSystemConfig(
    @Param('key') key: string,
    @Body() body: { value: string },
    @User() user: any,
  ) {
    await this.systemConfig.set(key, body.value, user?.id || user?.sub);
    // Invalida cache de todos ao mudar config global
    return { key, value: body.value };
  }

  // ── CRUD legado ────────────────────────────────────────────────────────

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
