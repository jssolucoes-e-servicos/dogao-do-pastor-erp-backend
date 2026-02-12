import { NotFoundException } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import {
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { paginate } from 'src/common/helpers/paginate.helper';
import { IPaginatedResponse } from 'src/common/interfaces';

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
  protected abstract model: Delegate;

  constructor(
    protected readonly configService: ConfigService,
    protected readonly logger: LoggerService,
    protected readonly prisma: PrismaService,
  ) {
    /* void */
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
