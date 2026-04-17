import { Injectable } from '@nestjs/common';
import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import {
  MW_ContributorWelcomeCredentials,
  MW_ContributorSystemLink,
} from 'src/common/messages';
import {
  delayBetweenMessages,
  delayBetweenContacts,
  delayBigPause,
} from 'src/common/helpers/whatsapp-delay.helper';
import { EvolutionService } from 'src/modules/evolution/services/evolution.service';

const BIG_PAUSE_EVERY = 30;

@Injectable()
export class ContributorsNotificationsService extends BaseService {
  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
    private readonly evolutionService: EvolutionService,
  ) {
    super(configService, loggerService, prismaService);
  }

  async sendWelcomeCredentialsAll(): Promise<{ total: number; success: number; errors: number }> {
    const contributors = await this.prisma.contributor.findMany({
      where: {
        active: true,
        phone: { not: null },
        username: { not: null },
      },
      select: { id: true, name: true, username: true, phone: true },
      orderBy: { createdAt: 'asc' },
    });

    let success = 0;
    let errors = 0;

    for (let i = 0; i < contributors.length; i++) {
      const contributor = contributors[i];

      if (!contributor.phone || !contributor.username) {
        errors++;
        continue;
      }

      try {
        this.logger.log(`[${i + 1}/${contributors.length}] Enviando credenciais para: ${contributor.phone} (@${contributor.username})`);

        const message = MW_ContributorWelcomeCredentials(contributor.name, contributor.username);
        await this.evolutionService.sendText(contributor.phone, message);

        await delayBetweenMessages();

        await this.evolutionService.sendText(contributor.phone, MW_ContributorSystemLink);

        success++;
      } catch (err: any) {
        this.logger.error(`Falha ao enviar para ${contributor.name} (${contributor.phone}): ${err?.message}`);
        errors++;
      }

      if ((i + 1) % BIG_PAUSE_EVERY === 0 && i + 1 < contributors.length) {
        this.logger.log(`[PAUSA] Aguardando pausa anti-bloqueio após ${i + 1} envios...`);
        await delayBigPause();
      } else if (i + 1 < contributors.length) {
        await delayBetweenContacts();
      }
    }

    this.logger.log(`Envio de credenciais concluído: ${success} enviados, ${errors} erros de ${contributors.length} colaboradores`);
    return { total: contributors.length, success, errors };
  }
}
