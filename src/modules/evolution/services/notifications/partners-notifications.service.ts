
import { Injectable } from '@nestjs/common';
import { PartnerEntity } from 'src/common/entities';
import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import {
  MW_PartnerWellcomePortal
} from 'src/common/messages';
import { MW_SendInvite } from 'src/common/messages/whatsapp/partners/send-invite.message';
import { EvolutionService } from 'src/modules/evolution/services/evolution.service';

@Injectable()
export class PartnersNotificationsService extends BaseService {
  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
    private readonly evolutionService: EvolutionService,
  ) {
    super(configService, loggerService, prismaService);
  }

  async welcomePortal(partner: PartnerEntity) {
    if (partner.responsiblePhone) {
      this.logger.log(
        `Enviando aviso de falha na entrega para ${partner.responsiblePhone}`,
      );
      const message = MW_PartnerWellcomePortal(partner);
      await this.evolutionService.sendText(partner.responsiblePhone, message);
    }
  }

  async sendInvite(partner: PartnerEntity, destination: string) {
    console.log('entrou na message do sendInvite');
    console.log(partner);
    if (destination) {
      this.logger.log(
        `Enviando aviso de falha na entrega para ${partner.responsiblePhone}`,
      );
      const message = MW_SendInvite(partner);
      await this.evolutionService.sendText(destination, message);
    }
  }
}
