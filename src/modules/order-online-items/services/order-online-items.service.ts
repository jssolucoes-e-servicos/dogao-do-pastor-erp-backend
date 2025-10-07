//ENDEREÇO/NOME DO ARQUIVO: src/modules/pre-sale/services/pre-sale.service.ts
import { PRICE_PER_DOG } from '@/common/constants';
import { PreOrderStepEnum } from '@/common/enums';
import { BaseService } from '@/common/services/base.service';
import { LoggerService } from '@/modules/logger/services/logger.service';
import { Injectable } from '@nestjs/common';
import { OrderOnlineInitRetrieveDTO } from 'src/modules/order-online/dto/order-online-init-retrieve.dto';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { OrderOnlineItemsManyCreateDTO } from '../dto/order-online-items-many-create.dto';

@Injectable()
export class OrderOnlineItemsService extends BaseService {
  constructor(loggerService: LoggerService, prismaService: PrismaService) {
    super(loggerService, prismaService);
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

    const presale = await this.prisma.orderOnline.update({
      where: {
        id: orderOnlineId,
      },
      data: {
        quantity: orderItems.length,
        valueTotal: orderItems.length * PRICE_PER_DOG,
        step: PreOrderStepEnum.delivery,
      },
    });

    return presale;
  }
}
