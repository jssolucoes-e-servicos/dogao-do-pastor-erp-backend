
import { Injectable } from '@nestjs/common';
import { SellerEntity } from 'src/common/entities';
import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { MW_SendWellcomeSeller } from 'src/common/messages/whatsapp/sellers/send-wellcome-seller.message';
import { EvolutionService } from 'src/modules/evolution/services/evolution.service';

@Injectable()
export class SellersNotificationsService extends BaseService {
  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
    private readonly evolutionService: EvolutionService,
  ) {
    super(configService, loggerService, prismaService);
  }

  async welcomeSeller(seller: SellerEntity) {
    if (seller.contributor.phone) {
      this.logger.log(
        `Enviando aviso de falha na entrega para ${seller.contributor.phone}`,
      );
      const url = `${process.env.FRONTEND_PORTALS_URL}/comprar?v=${seller.tag}`;
      const message = MW_SendWellcomeSeller(seller);
      //await this.evolutionService.sendText('51982488374', message);
      //await this.evolutionService.sendText('51982488374', url);
      await this.evolutionService.sendText(seller.contributor.phone, message);
      await this.evolutionService.sendText(seller.contributor.phone, url);
    }
  }
}
