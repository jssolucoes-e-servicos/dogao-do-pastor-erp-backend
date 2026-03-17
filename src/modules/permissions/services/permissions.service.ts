import { Injectable } from '@nestjs/common';
import { PermissionEntity } from 'src/common/entities';
import {
  BaseCrudService,
  ConfigService,
  LoggerService,
  PrismaBase,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';

@Injectable()
export class PermissionsService extends BaseCrudService<
  PermissionEntity,
  CreatePermissionDto,
  UpdatePermissionDto,
  PrismaBase.PermissionDelegate
> {
  protected model: PrismaBase.PermissionDelegate;

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
  ) {
    super(configService, loggerService, prismaService);
    this.model = this.prisma.permission;
  }
}
