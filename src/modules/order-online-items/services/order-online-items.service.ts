//ENDEREÇO/NOME DO ARQUIVO: src/modules/pre-sale/services/pre-sale.service.ts
import { PRICE_PER_DOG } from '@/common/constants';
import { PreOrderStepEnum } from '@/common/enums';
import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from '@/common/helpers/importer-helper';
import { Injectable } from '@nestjs/common';
import { OrderOnlineInitRetrieveDTO } from 'src/modules/order-online/dto/order-online-init-retrieve.dto';
import { OrderOnlineItemsManyCreateDTO } from '../dto/order-online-items-many-create.dto';

@Injectable()
export class OrderOnlineItemsService extends BaseService {
  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    configService: ConfigService,
  ) {
    super(loggerService, prismaService, configService);
  }

  async inserts(
    body: OrderOnlineItemsManyCreateDTO,
  ): Promise<OrderOnlineInitRetrieveDTO> {
    const { orderOnlineId, orderItems } = body;

    await this.prisma.orderOnlineItem.deleteMany({
      where: { orderOnlineId: orderOnlineId },
    });

    const itemsToCreate = orderItems.map((item) => ({
      orderOnlineId: orderOnlineId,
      removedIngredients: item.removedIngredients,
    }));

    await this.prisma.orderOnlineItem.createMany({
      data: itemsToCreate,
    });

    const inDevelopment =
      process.env.ENVIROMENT === 'developement' ? true : false;
    const totalToSave: number =
      inDevelopment === true ? 1 : orderItems.length * PRICE_PER_DOG;

    const presale = await this.prisma.orderOnline.update({
      where: {
        id: orderOnlineId,
      },
      data: {
        quantity: orderItems.length,
        valueTotal: totalToSave, // orderItems.length * PRICE_PER_DOG,
        step: PreOrderStepEnum.delivery,
      },
    });

    return presale;
  }
}
