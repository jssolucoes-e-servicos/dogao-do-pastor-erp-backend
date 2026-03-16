import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandEntity } from 'src/common/entities';
import {
  BaseCrudService,
  ConfigService,
  LoggerService,
  PrismaBase,
  PrismaService,
  PaginationQueryDto,
} from 'src/common/helpers/importer.helper';
import { IPaginatedResponse } from 'src/common/interfaces';
import { UpdateCommandDto } from '../dto/update-command.dto';
import { getActiveEdition } from 'src/common/helpers/edition-helper';

@Injectable()
export class CommandsService extends BaseCrudService<
  CommandEntity,
  any,
  UpdateCommandDto,
  PrismaBase.CommandDelegate
> {
  protected model: PrismaBase.CommandDelegate;

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
  ) {
    super(configService, loggerService, prismaService);
    this.model = this.prisma.command;
  }

  async list(
    query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<CommandEntity>> {
    const edition = await getActiveEdition(this.prisma);
    if (!edition) {
      throw new NotFoundException('Nenhuma edição ativa encontrada');
    }

    const { search } = query;
    let where: any = {
      editionId: edition.id,
      active: true,
    };

    if (search) {
      where.OR = [
        { sequentialId: { contains: search, mode: 'insensitive' } },
        { order: { customerName: { contains: search, mode: 'insensitive' } } },
        { order: { customerPhone: { contains: search } } },
      ];
    }

    return this.paginate(query, {
      where,
      include: {
        order: {
          include: {
            customer: true,
            address: true,
          },
        },
        withdrawal: {
          include: {
            partner: true,
          },
        },
      },
      orderBy: { sequence: 'desc' },
    });
  }

  async remove(id: string): Promise<CommandEntity> {
    return super.softDelete({ id });
  }

  async restore(id: string): Promise<CommandEntity> {
    return super.restoreData({ id });
  }
}
