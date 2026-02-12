import { ConflictException, Injectable } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { CellNetworkEntity } from 'src/common/entities';
import {
  BaseCrudService,
  ConfigService,
  LoggerService,
  PrismaBase,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { IPaginatedResponse } from 'src/common/interfaces';
import { CreateCellsNetworkDto } from '../dto/create-cells-network.dto';
import { UpdateCellsNetworkDto } from '../dto/update-cells-network.dto';

@Injectable()
export class CellsNetworksService extends BaseCrudService<
  CellNetworkEntity,
  CreateCellsNetworkDto,
  UpdateCellsNetworkDto,
  PrismaBase.CellNetworkDelegate
> {
  protected model: PrismaBase.CellNetworkDelegate;

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
  ) {
    super(configService, loggerService, prismaService);
    this.model = this.prisma.cellNetwork;
  }

  /* ======================================================
   * Regras de negócio
   * ====================================================== */

  private async validateCreate(dto: CreateCellsNetworkDto): Promise<void> {
    const or: PrismaBase.CellNetworkWhereInput[] = [];

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
        `Já existe uma Rede de Célula cadastrada com o nome "${dto.name}"`,
      );
    }
  }

  /* ======================================================
   * CRUD
   * ====================================================== */

  async create(dto: CreateCellsNetworkDto): Promise<CellNetworkEntity> {
    await this.validateCreate(dto);
    return this.model.create({
      data: dto,
    }) as unknown as CellNetworkEntity;
  }

  async list(
    query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<CellNetworkEntity>> {
    return this.paginate(query, {
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<CellNetworkEntity> {
    return super.findById(id);
  }

  async fyndBySupervisorId(supervisorId: string): Promise<CellNetworkEntity> {
    const network = await super.findOne({ supervisorId: supervisorId });
    return network;
  }

  async update(
    id: string,
    dto: UpdateCellsNetworkDto,
  ): Promise<CellNetworkEntity> {
    return super.update(id, dto);
  }

  async remove(id: string): Promise<CellNetworkEntity> {
    return super.softDelete({ id });
  }

  async restore(id: string): Promise<CellNetworkEntity> {
    return super.restoreData({ id });
  }
}
