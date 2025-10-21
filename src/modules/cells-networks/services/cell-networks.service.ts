import { ICellNetwork } from '@/common/dtos';
import { Injectable } from '@nestjs/common';
import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer-helper';

@Injectable()
export class CellsNetworksService extends BaseService {
  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    configService: ConfigService,
  ) {
    super(loggerService, prismaService, configService);
  }

  async count(): Promise<{ cells: number }> {
    const count = await this.prisma.cell.count();

    return { cells: count };
  }

  async findAll(): Promise<ICellNetwork[]> {
    const networks = await this.prisma.cellNetwork.findMany();
    return networks;
  }
}
