// src/modules/editions/services/editions.service.ts

import { ConflictException, Injectable } from '@nestjs/common';
import { EditionEntity } from 'src/common/entities';
import { getActiveEdition } from 'src/common/helpers/edition-helper';
import {
  BaseCrudService,
  ConfigService,
  LoggerService,
  PaginationQueryDto,
  PrismaBase,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { IPaginatedResponse } from 'src/common/interfaces';
import { EditionResponseType } from 'src/common/types/edition-response.type';
import { CreateEditionDto } from 'src/modules/editions/dto/create-edition.dto';
import { UpdateEditionDto } from 'src/modules/editions/dto/update-edition.dto';

@Injectable()
export class EditionsService extends BaseCrudService<
  EditionEntity,
  CreateEditionDto,
  UpdateEditionDto,
  PrismaBase.EditionDelegate
> {
  protected model: PrismaBase.EditionDelegate;

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
  ) {
    super(configService, loggerService, prismaService);
    this.model = this.prisma.edition;
  }

  /* ======================================================
   * Regras de negócio
   * ====================================================== */

  private async validateCreate(dto: CreateEditionDto): Promise<void> {
    const exists = await this.model.findFirst({
      where: {
        OR: [{ name: dto.name }, { productionDate: dto.productionDate }],
      },
    });

    if (!exists) return;

    if (exists.name === dto.name) {
      throw new ConflictException(
        `Já existe uma edição cadastrada com o nome "${dto.name}"`,
      );
    }

    if (
      exists.productionDate?.getTime() ===
      new Date(dto.productionDate).getTime()
    ) {
      throw new ConflictException(
        'Já existe uma edição cadastrada para esta data de produção',
      );
    }
  }

  /**
   * Gera o código da edição no formato:
   * YY + sequência do ano (baseado em registros NÃO deletados)
   */
  private async generateEditionCode(productionDate: Date): Promise<string> {
    const year = productionDate.getFullYear();
    const yearShort = year % 100; // ex: 2026 -> 26

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const count = await this.model.count({
      where: {
        productionDate: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    });

    /**
     * sequência começa em 1
     */
    const sequence = count + 1;

    return String(`${yearShort}${sequence}`);
  }

  /* ======================================================
   * CRUD
   * ====================================================== */

  async create(dto: CreateEditionDto): Promise<EditionEntity> {
    await this.validateCreate(dto);

    const code = await this.generateEditionCode(new Date(dto.productionDate));

    return await this.model.create({
      data: {
        ...dto,
        code,
      },
    });
  }

  async getActiveEdition(): Promise<EditionResponseType> {
    const edition = await getActiveEdition(this.prisma);
    const result = {
      edition: edition,
      message: !edition ? 'Nenhuma Edição com venda ativa' : 'ok',
    };
    return result;
  }

  async list(
    query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<EditionEntity>> {
    return await this.paginate(query, {
      orderBy: { saleStartDate: 'desc' },
    });
  }

  async findById(id: string): Promise<EditionEntity> {
    return await super.findById(id);
  }

  async update(id: string, dto: UpdateEditionDto): Promise<EditionEntity> {
    /**
     * Garantia extra de imutabilidade
     */
    /* if ('code' in dto) {
      delete (dto as any).code;
    } */

    return await super.update(id, dto);
  }

  async remove(id: string): Promise<EditionEntity> {
    return await super.softDelete({ id });
  }

  async restore(id: string): Promise<EditionEntity> {
    return await super.restoreData({ id });
  }
}
