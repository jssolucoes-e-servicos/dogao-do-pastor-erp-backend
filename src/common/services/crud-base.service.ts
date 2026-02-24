import { NotFoundException } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import {
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { paginate } from 'src/common/helpers/paginate.helper';
import { IPaginatedResponse } from 'src/common/interfaces';
import { LogMethodsType } from '../types/log-methods.type';

export abstract class BaseCrudService<
  Entity,
  CreateDto,
  UpdateDto,
  Delegate extends {
    findMany: Function;
    findFirst: Function;
    findUnique: Function;
    create: Function;
    update: Function;
    count: Function;
  },
> {
  protected readonly _name: string = this.constructor.name;
  protected abstract model: Delegate;
  protected readonly logger: LogMethodsType;
  protected readonly prisma: PrismaService;
  protected readonly configs: ConfigService;

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
  ) {
    this.logger = {
      log: (message: string) => loggerService.setLog(this._name, message),
      warn: (message: string) => loggerService.setWarn(this._name, message),
      error: (message: string) => loggerService.setError(this._name, message),
    } as LogMethodsType;

    this.prisma = prismaService;
    this.configs = configService;
  }

  /* ======================================================
   * Helpers
   * ====================================================== */

  protected withSoftDelete(where: any) {
    return {
      ...where,
      deletedAt: null,
    };
  }

  /* ======================================================
   * READ
   * ====================================================== */

  async paginate(
    query: PaginationQueryDto,
    options?: Record<string, any>,
  ): Promise<IPaginatedResponse<Entity>> {
    return paginate(this.prisma, this.model, query, options);
  }

  async findOne(where: any, args?: any): Promise<Entity> {
    const entity = await this.model.findFirst({
      where: this.withSoftDelete(where),
      ...args,
    });

    /* if (!entity) {
      throw new NotFoundException('Registro não encontrado');
    } */

    return entity;
  }

  async findById(id: string, args?: any): Promise<Entity> {
    const entity = await this.model.findUnique({
      where: { id },
      ...args,
    });

    if (!entity || entity.deletedAt) {
      throw new NotFoundException('Registro não encontrado');
    }

    return entity;
  }

  /* ======================================================
   * WRITE
   * ====================================================== */

  async create(dto: CreateDto): Promise<Entity> {
    return this.model.create({
      data: dto as any,
    }) as unknown as Entity;
  }

  async update(id: string, dto: UpdateDto): Promise<Entity> {
    await this.findById(id);

    return this.model.update({
      where: { id },
      data: dto,
    });
  }

  /* ======================================================
   * SOFT DELETE
   * ====================================================== */

  async softDelete(where: any): Promise<Entity> {
    const entity = await this.findOne(where);

    return this.model.update({
      where: { id: (entity as any).id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async restoreData(where: any): Promise<Entity> {
    const entity = await this.model.findFirst({
      where,
    });

    if (!entity) {
      throw new NotFoundException('Registro não encontrado');
    }

    return this.model.update({
      where: { id: entity.id },
      data: {
        deletedAt: null,
      },
    });
  }
}
