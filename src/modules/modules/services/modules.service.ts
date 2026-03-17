import { Injectable } from '@nestjs/common';
import { ModuleEntity } from 'src/common/entities/module.entity';
import {
  BaseCrudService,
  ConfigService,
  LoggerService,
  PrismaBase,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { CreateModuleDto } from '../dto/create-module.dto';
import { UpdateModuleDto } from '../dto/update-module.dto';

@Injectable()
export class ModulesService extends BaseCrudService<
  ModuleEntity,
  CreateModuleDto,
  UpdateModuleDto,
  PrismaBase.ModuleDelegate
> {
  protected model: PrismaBase.ModuleDelegate;

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
  ) {
    super(configService, loggerService, prismaService);
    this.model = this.prisma.module;
  }

  async findAll() {
    return this.model.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }
}
