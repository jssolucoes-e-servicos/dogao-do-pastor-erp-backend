import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { OrderEntity, OrderItemEntity } from 'src/common/entities';
import { SiteOrderStepEnum } from 'src/common/enums';
import { getActiveEdition } from 'src/common/helpers/edition-helper';
import {
  BaseCrudService,
  ConfigService,
  LoggerService,
  PrismaBase,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { IPaginatedResponse } from 'src/common/interfaces';
import { OrderItemsManyCreateDTO } from '../dto/order-items-many-create.dto';

@Injectable()
export class OrdersItemsService extends BaseCrudService<
  OrderItemEntity,
  any,
  any,
  PrismaBase.OrderItemDelegate
> {
  protected model: PrismaBase.OrderItemDelegate;

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
  ) {
    super(configService, loggerService, prismaService);
    this.model = this.prisma.orderItem;
  }

  async inserts(dto: OrderItemsManyCreateDTO) {
    const { orderId, orderItems } = dto;

    const edition = await getActiveEdition(this.prisma);
    if (!edition) {
      throw new NotFoundException('Nenuma edição ativa no momento.');
    }
    await this.model.deleteMany({
      where: { orderId: orderId },
    });
    const itemsToCreate = orderItems.map((item) => ({
      orderId: orderId,
      removedIngredients: item.removedIngredients,
      unitPrice: edition.dogPrice,
    }));

    await this.model.createMany({
      data: itemsToCreate,
    });

    const inDevelopment =
      process.env.NODE_ENV === 'developement' ? true : false;
    const totalToSave: number =
      inDevelopment === true ? 1 : orderItems.length * edition.dogPrice;

    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        totalValue: totalToSave,
        siteStep: SiteOrderStepEnum.DELIVERY,
      },
      include: {
        edition: true,
        seller: true,
        customer: true,
        items: true,
        commands: true,
        deliveryStops: true,
      },
    });
    return order;
  }

  async list(
    query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<OrderItemEntity>> {
    return this.paginate(query, {
      include: {
        order: true,
        vouchers: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string): Promise<OrderItemEntity> {
    return super.findById(id, {
      include: {
        order: true,
        vouchers: true,
      },
    });
  }

  async findByOrderId(id: string): Promise<OrderItemEntity> {
    return super.findOne(
      { orderId: id },
      {
        include: {
          order: true,
          vouchers: true,
        },
      },
    );
  }

  async update(id: string, dto: any): Promise<OrderItemEntity> {
    return super.update(id, dto);
  }

  async remove(id: string): Promise<OrderItemEntity> {
    return super.softDelete({ id });
  }

  async restore(id: string): Promise<OrderItemEntity> {
    return super.restoreData({ id });
  }
}
