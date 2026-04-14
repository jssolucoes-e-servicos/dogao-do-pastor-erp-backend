import { Injectable } from '@nestjs/common';
import { RoleEntity } from 'src/common/entities';
import {
  BaseCrudService,
  ConfigService,
  LoggerService,
  PrismaBase,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';

@Injectable()
export class RolesService extends BaseCrudService<
  RoleEntity,
  CreateRoleDto,
  UpdateRoleDto,
  PrismaBase.RoleDelegate
> {
  protected model: PrismaBase.RoleDelegate;

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
  ) {
    super(configService, loggerService, prismaService);
    this.model = this.prisma.role;
  }

  async findById(id: string) {
    return super.findById(id, {
      include: {
        permissions: { include: { module: true } },
        users: { include: { contributor: true } },
      },
    });
  }

  async setRolePermission(
    roleId: string,
    moduleId: string,
    permissions: {
      access?: boolean;
      create?: boolean;
      update?: boolean;
      delete?: boolean;
      report?: boolean;
    },
  ) {
    // Busca permissão existente ou cria nova
    const existing = await this.prisma.permission.findFirst({
      where: {
        roleId,
        moduleId,
      },
    });

    if (existing) {
      return await this.prisma.permission.update({
        where: { id: existing.id },
        data: {
          ...permissions,
        },
      });
    }

    return await this.prisma.permission.create({
      data: {
        roleId,
        moduleId,
        ...permissions,
      },
    });
  }
}
