// src/modules/sellers/services/sellers.services.ts

import { ConflictException, Injectable } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SellerEntity } from 'src/common/entities';
import {
  BaseCrudService,
  ConfigService,
  LoggerService,
  PrismaBase,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { IPaginatedResponse } from 'src/common/interfaces';
import { CreateSellerDto } from '../dto/create-seller.dto';
import { UpdateSellerDto } from '../dto/update-seller.dto';

@Injectable()
export class SellersService extends BaseCrudService<
  SellerEntity,
  CreateSellerDto,
  UpdateSellerDto,
  PrismaBase.SellerDelegate
> {
  protected model: PrismaBase.SellerDelegate;

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
  ) {
    super(configService, loggerService, prismaService);
    this.model = this.prisma.seller;
  }

  /* ======================================================
   * Regras de negócio
   * ====================================================== */

  private async validateCreate(dto: CreateSellerDto): Promise<void> {
    const or: PrismaBase.SellerWhereInput[] = [];

    if (dto.tag) {
      or.push({ tag: dto.tag });
    }

    if (!or.length) return;

    const exists = await this.model.findFirst({
      where: { OR: or },
    });

    if (!exists) return;

    if (exists.tag === dto.tag) {
      throw new ConflictException(
        `Já existe um Vendedor cadastrado com a TAG "${dto.tag}"`,
      );
    }
  }

  async create(dto: CreateSellerDto): Promise<SellerEntity> {
    await this.validateCreate(dto);
    return this.model.create({
      data: dto,
    }) as unknown as SellerEntity;
  }

  async list(
    query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<SellerEntity>> {
    return this.paginate(query, {
      orderBy: {
        contributor: {
          name: 'asc',
        },
      },
    });
  }

  async findById(id: string): Promise<SellerEntity> {
    return super.findById(id);
  }

  async findByTag(tag: string): Promise<SellerEntity> {
    const seller = await super.findOne({ tag: tag });
    return seller;
  }

  async findByContributorId(id: string): Promise<SellerEntity> {
    const seller = await super.findOne({ contributorId: id });
    return seller;
  }

  async findByCellId(id: string): Promise<SellerEntity> {
    const seller = await super.findOne({ cellId: id });
    return seller;
  }

  async update(id: string, dto: UpdateSellerDto): Promise<SellerEntity> {
    return super.update(id, dto);
  }

  async remove(id: string): Promise<SellerEntity> {
    return super.softDelete({ id });
  }

  async restore(id: string): Promise<SellerEntity> {
    return super.restoreData({ id });
  }
}
