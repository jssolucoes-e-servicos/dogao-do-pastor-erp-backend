import { Injectable } from '@nestjs/common';
import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer-helper';
import { CellsRetrieveDto } from 'src/modules/cells/dto/cells.retrieve.dto';

@Injectable()
export class CellsService extends BaseService {
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

  async findAll(): Promise<CellsRetrieveDto[]> {
    const cells = await this.prisma.cell.findMany({
      include: {
        network: true,
      },
    });
    return cells;
  }
}
