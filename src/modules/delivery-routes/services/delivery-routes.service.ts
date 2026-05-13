import { Injectable, NotFoundException } from '@nestjs/common';
import { DeliveryRouteEntity } from 'src/common/entities';
import { DeliveryRouteStatusEnum, OrderStatusEnum } from 'src/common/enums';
import {
  BaseCrudService,
  ConfigService,
  LoggerService,
  PrismaBase,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { CreateDeliveryRouteDto } from '../dto/create-delivery-route.dto';

@Injectable()
export class DeliveryRoutesService extends BaseCrudService<
  DeliveryRouteEntity,
  CreateDeliveryRouteDto,
  any,
  PrismaBase.DeliveryRouteDelegate
> {
  protected model: PrismaBase.DeliveryRouteDelegate;

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
  ) {
    super(configService, loggerService, prismaService);
    this.model = this.prisma.deliveryRoute;
  }

  /**
   * Cria uma nova rota de entrega e vincula os pedidos como paradas.
   */
  async create(dto: CreateDeliveryRouteDto): Promise<DeliveryRouteEntity> {
    const { deliveryPersonId, orderIds } = dto;

    // 1. Verifica se o entregador existe
    const person = await this.prisma.deliveryPerson.findUnique({
      where: { id: deliveryPersonId },
    });
    if (!person) {
      throw new NotFoundException('Entregador não encontrado');
    }

    // 2. Cria a rota e as paradas em uma transação
    const route = await this.prisma.$transaction(async (tx) => {
      const newRoute = await tx.deliveryRoute.create({
        data: {
          deliveryPersonId,
          status: DeliveryRouteStatusEnum.PENDING,
          totalStops: orderIds.length,
          stops: {
            create: orderIds.map((orderId, index) => ({
              orderId,
              sequence: index + 1,
            })),
          },
        },
        include: {
          stops: true,
        },
      });

      // 3. Atualiza o status dos pedidos para EXPEDITION (Expedição)
      await tx.order.updateMany({
        where: { id: { in: orderIds } },
        data: { status: OrderStatusEnum.EXPEDITION },
      });

      // 4. Se houver comandos vinculados, atualiza para QUEUED_FOR_DELIVERY
      // Nota: O model Command usa CommandStatusEnum.QUEUED_FOR_DELIVERY (string)
      await tx.command.updateMany({
        where: { orderId: { in: orderIds }, active: true },
        data: { status: 'QUEUED_FOR_DELIVERY' },
      });

      return newRoute;
    });

    return route as unknown as DeliveryRouteEntity;
  }

  /**
   * Inicia a rota
   */
  async startRoute(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const route = await tx.deliveryRoute.update({
        where: { id },
        data: {
          status: DeliveryRouteStatusEnum.IN_PROGRESS,
          startedAt: new Date(),
        },
        include: { stops: true },
      });

      const orderIds = route.stops.map((s) => s.orderId);

      // Atualiza pedidos para ENTREGANDO
      await tx.order.updateMany({
        where: { id: { in: orderIds } },
        data: { status: OrderStatusEnum.DELIVERING },
      });

      // Atualiza comandos para SAIU PARA ENTREGA
      await tx.command.updateMany({
        where: { orderId: { in: orderIds }, active: true },
        data: { status: 'OUT_FOR_DELIVERY' },
      });

      return route;
    });
  }

  /**
   * Finaliza a rota
   */
  async finishRoute(id: string) {
    const route = await this.model.update({
      where: { id },
      data: {
        status: DeliveryRouteStatusEnum.FINISHED,
        finishedAt: new Date(),
      },
    });
    return route;
  }
}
