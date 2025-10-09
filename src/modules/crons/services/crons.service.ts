import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from '@/common/helpers/importer-helper';
import { Injectable } from '@nestjs/common';
import { EvolutionService } from 'src/modules/evolution/services/evolution.service';

@Injectable()
export class CronsService extends BaseService {
  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    configService: ConfigService,
    private readonly evolutionService: EvolutionService,
  ) {
    super(loggerService, prismaService, configService);
  }

  // @Cron(CronExpression.EVERY_MINUTE)
  async processWhatsappMessages() {
    const penddings = await this.prisma.whatsappQueue.findMany();
    if (penddings) {
      //  await this.evolutionService.sendText();
    }
  }
}
