import { Injectable } from '@nestjs/common';
import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import {
  MW_CustomerNewEditionAnnouncement,
  MW_CustomerNewEditionLink,
} from 'src/common/messages';
import {
  delayBetweenMessages,
  delayBetweenContacts,
  delayBigPause,
} from 'src/common/helpers/whatsapp-delay.helper';
import { EvolutionService } from 'src/modules/evolution/services/evolution.service';

// Pausa grande a cada N contatos
const BIG_PAUSE_EVERY = 30;

@Injectable()
export class CustomersNotificationsService extends BaseService {
  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
    private readonly evolutionService: EvolutionService,
  ) {
    super(configService, loggerService, prismaService);
  }

  async announceNewEdition(): Promise<{ total: number; success: number; errors: number }> {
    const customers = await this.prisma.customer.findMany({
      where: {
        active: true,
        phone: { not: '' },
        NOT: [
          { name: { startsWith: 'Cliente -' } },
          { name: { startsWith: 'CLIENTE -' } },
          { name: { startsWith: 'cliente -' } },
        ],
      },
      select: { id: true, name: true, phone: true },
      orderBy: { createdAt: 'asc' },
    });

    let success = 0;
    let errors = 0;

    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      try {
        this.logger.log(`[${i + 1}/${customers.length}] Anunciando nova edição para: ${customer.phone}`);

        const message = MW_CustomerNewEditionAnnouncement(customer.name);
        await this.evolutionService.sendText(customer.phone, message);

        // Delay entre as duas mensagens do mesmo contato
        await delayBetweenMessages();

        await this.evolutionService.sendText(customer.phone, MW_CustomerNewEditionLink);

        success++;
      } catch (err: any) {
        this.logger.error(`Falha ao enviar para ${customer.name} (${customer.phone}): ${err?.message}`);
        errors++;
      }

      // Pausa grande a cada BIG_PAUSE_EVERY contatos
      if ((i + 1) % BIG_PAUSE_EVERY === 0 && i + 1 < customers.length) {
        this.logger.log(`[PAUSA] Aguardando pausa anti-bloqueio após ${i + 1} envios...`);
        await delayBigPause();
      } else if (i + 1 < customers.length) {
        // Delay normal entre contatos
        await delayBetweenContacts();
      }
    }

    this.logger.log(`Anúncio nova edição concluído: ${success} enviados, ${errors} erros de ${customers.length} clientes`);
    return { total: customers.length, success, errors };
  }
}
