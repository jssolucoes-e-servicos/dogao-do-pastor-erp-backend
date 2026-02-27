import { ConflictException, Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { ContributorEntity } from 'src/common/entities';
import {
  BaseCrudService,
  ConfigService,
  LoggerService,
  PrismaBase,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { IPaginatedResponse } from 'src/common/interfaces';
import { CreateContributorDto } from 'src/modules/contributors/dto/create-contributor.dto';
import { UpdateContributorDto } from 'src/modules/contributors/dto/update-contributor.dto';

@Injectable()
export class ContributorsService extends BaseCrudService<
  ContributorEntity,
  CreateContributorDto,
  UpdateContributorDto,
  PrismaBase.ContributorDelegate
> {
  protected model: PrismaBase.ContributorDelegate;

  /**
   * Nunca retornar senha
   */
  protected defaultSelect = {
    password: false,
  };

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
  ) {
    super(configService, loggerService, prismaService);
    this.model = this.prisma.contributor;
  }

  /* ======================================================
   * Regras de negócio
   * ====================================================== */

  private async validateCreate(dto: CreateContributorDto): Promise<void> {
    const or: PrismaBase.ContributorWhereInput[] = [];

    if (dto.name) {
      or.push({ name: dto.name });
    }

    if (dto.username) {
      or.push({ username: dto.username });
    }

    if (dto.phone) {
      or.push({ phone: dto.phone });
    }

    if (!or.length) return;

    const exists = await this.model.findFirst({
      where: { OR: or },
    });

    if (!exists) return;

    if (exists.name === dto.name) {
      throw new ConflictException(
        `Já existe um colaborador cadastrado com o nome "${dto.name}"`,
      );
    }

    if (dto.username && exists.username === dto.username) {
      throw new ConflictException(
        `Já existe um colaborador cadastrado com o username "${dto.username}"`,
      );
    }

    if (dto.phone && exists.phone === dto.phone) {
      throw new ConflictException(
        `Já existe um colaborador cadastrado com o telefone "${dto.phone}"`,
      );
    }
  }

  /* ======================================================
   * CRUD
   * ====================================================== */

  async create(dto: CreateContributorDto): Promise<ContributorEntity> {
    await this.validateCreate(dto);

    const password = await bcrypt.hash('dogao@2026', 10);

    return this.model.create({
      data: {
        ...dto,
        password,
      },
    }) as unknown as ContributorEntity;
  }

  async list(
    query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<ContributorEntity>> {
    const { search } = query;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { username: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
            {
              cells: {
                some: {
                  name: { contains: search, mode: 'insensitive' },
                },
              },
            },
            {
              cellNetworks: {
                some: {
                  name: { contains: search, mode: 'insensitive' },
                },
              },
            },
          ],
        }
      : {};

    return this.paginate(query, {
      where,
      include: {
        cells: true,
        cellNetworks: true,
        deliveryPersons: true,
        sellers: true,
        userRoles: true,
        permissions: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<ContributorEntity> {
    return super.findById(id, {
      include: {
        cells: true,
        cellNetworks: true,
        deliveryPersons: true,
        sellers: true,
        userRoles: true,
        permissions: true,
      },
    });
  }

  async findByUsername(username: string): Promise<ContributorEntity> {
    const contributor = await super.findOne(
      {
        username: username,
      },
      {
        include: {
          cells: true,
          cellNetworks: true,
          deliveryPersons: true,
          sellers: true,
          userRoles: true,
          permissions: true,
        },
      },
    );
    return contributor;
  }

  async findForLogin(username: string) {
    const contributor = await this.model.findFirst({
      where: {
        username: username,
      },
      include: {
        sellers: true,
        cells: true,
        cellNetworks: true,
        deliveryPersons: true,
        userRoles: true,
        permissions: true,
      },
    });
    return contributor;
  }

  async update(
    id: string,
    dto: UpdateContributorDto,
  ): Promise<ContributorEntity> {
    return super.update(id, dto);
  }

  async remove(id: string): Promise<ContributorEntity> {
    return super.softDelete({ id });
  }

  async restore(id: string): Promise<ContributorEntity> {
    return super.restoreData({ id });
  }
}
