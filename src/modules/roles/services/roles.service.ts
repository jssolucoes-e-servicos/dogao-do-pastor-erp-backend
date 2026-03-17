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
}
