import { ConflictException, Injectable } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { DeliveryPersonEntity } from 'src/common/entities';
import {
  BaseCrudService,
  ConfigService,
  LoggerService,
  PrismaBase,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { IPaginatedResponse } from 'src/common/interfaces';
import { CreateDeliveryPersonDto } from 'src/modules/delivery-persons/dto/create-delivery-person.dto';
import { UpdateDeliveryPersonDto } from 'src/modules/delivery-persons/dto/update-delivery-person.dto';

@Injectable()
export class DeliveryPersonsService extends BaseCrudService<
  DeliveryPersonEntity,
  CreateDeliveryPersonDto,
  UpdateDeliveryPersonDto,
  PrismaBase.DeliveryPersonDelegate
> {
  protected model: PrismaBase.DeliveryPersonDelegate;

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
  ) {
    super(configService, loggerService, prismaService);
    this.model = this.prisma.deliveryPerson;
  }

  private async validateCreate(dto: CreateDeliveryPersonDto): Promise<void> {
    const or: PrismaBase.DeliveryPersonWhereInput[] = [];

    if (dto.contributorId) {
      or.push({ contributorId: dto.contributorId });
    }

    if (!or.length) return;

    const exists = await this.model.findFirst({
      where: { OR: or },
    });

    if (!exists) return;

    if (exists.contributorId === dto.contributorId) {
      throw new ConflictException(
        `Já existe um Entregador vinculado para o Colaborador de ID: "${dto.contributorId}"`,
      );
    }
  }

  async create(dto: CreateDeliveryPersonDto): Promise<DeliveryPersonEntity> {
    await this.validateCreate(dto);
    return this.model.create({
      data: dto,
    }) as unknown as DeliveryPersonEntity;
  }

  async list(
    query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<DeliveryPersonEntity>> {
    return this.paginate(query, {
      orderBy: {
        contributor: {
          name: 'asc',
        },
      },
    });
  }

  async findById(id: string): Promise<DeliveryPersonEntity> {
    return super.findById(id);
  }

  async findByContributorId(id: string): Promise<DeliveryPersonEntity> {
    const deliveryPerson = await super.findOne({ contributorId: id });
    return deliveryPerson;
  }

  async update(
    id: string,
    dto: UpdateDeliveryPersonDto,
  ): Promise<DeliveryPersonEntity> {
    return super.update(id, dto);
  }

  async remove(id: string): Promise<DeliveryPersonEntity> {
    return super.softDelete({ id });
  }

  async restore(id: string): Promise<DeliveryPersonEntity> {
    return super.restoreData({ id });
  }
}
