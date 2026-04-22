import { ConflictException, Injectable } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { CellEntity } from 'src/common/entities';
import {
  BaseCrudService,
  ConfigService,
  LoggerService,
  PrismaBase,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { IPaginatedResponse } from 'src/common/interfaces';
import { CreateCellDto } from '../dto/create-cell.dto';
import { UpdateCellDto } from '../dto/update-cell.dto';

@Injectable()
export class CellsService extends BaseCrudService<
  CellEntity,
  CreateCellDto,
  UpdateCellDto,
  PrismaBase.CellDelegate
> {
  protected model: PrismaBase.CellDelegate;

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
  ) {
    super(configService, loggerService, prismaService);
    this.model = this.prisma.cell;
  }

  private async validateCreate(dto: CreateCellDto): Promise<void> {
    const or: PrismaBase.CellWhereInput[] = [];

    if (dto.name) {
      or.push({ name: dto.name });
    }

    if (!or.length) return;

    const exists = await this.model.findFirst({
      where: { OR: or },
    });

    if (!exists) return;

    if (exists.name === dto.name) {
      throw new ConflictException(
        `Já existe uma Célula cadastrada com o nome "${dto.name}"`,
      );
    }
  }

  async create(dto: CreateCellDto): Promise<CellEntity> {
    await this.validateCreate(dto);
    return this.model.create({
      data: dto,
    }) as unknown as CellEntity;
  }

  async list(
    query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<CellEntity>> {
    const { search } = query;

    let where = {};

    if (search) {
      where = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          {
            leader: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
          {
            network: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
        ],
      };
    }

    return this.paginate(query, {
      where,
      include: {
        leader: true,
        network: {
          include: {
            supervisor: true,
          },
        },
        sellers: true,
        seller: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async listAll(): Promise<object[]> {
    return await this.model.findMany({
      include: {
        leader: true,
        network: {
          include: {
            supervisor: true,
          },
        },
        sellers: true,
        seller: true,
      },
    });
  }

  async findById(id: string): Promise<CellEntity> {
    return super.findById(id, {
      include: {
        leader: true,
        network: { include: { supervisor: true } },
        sellers: { select: { id: true, tag: true, name: true } },
        seller: true,
      },
    });
  }

  async fyndByLeaderId(leaderId: string): Promise<CellEntity> {
    const network = await super.findOne(
      { leaderId: leaderId },
      {
        include: {
          leader: true,
          network: { include: { supervisor: true } },
          sellers: { select: { id: true, tag: true, name: true } },
          seller: true,
        },
      },
    );
    return network;
  }

  async update(id: string, dto: UpdateCellDto): Promise<CellEntity> {
    return super.update(id, dto);
  }

  async remove(id: string): Promise<CellEntity> {
    return super.softDelete({ id });
  }

  async restore(id: string): Promise<CellEntity> {
    return super.restoreData({ id });
  }
}
