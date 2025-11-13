import { Injectable } from '@nestjs/common';
import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer-helper';
//import { zonedTimeToUtc } from 'date-fns-tz';

import { endOfDay, startOfDay, subDays, subMilliseconds } from 'date-fns';
import { EvolutionNotificationsService } from 'src/modules/evolution/services/evolution-notifications.service';

@Injectable()
export class OrderOnlinePendingService extends BaseService {
  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    configService: ConfigService,
    private readonly evolutionNotifications: EvolutionNotificationsService,
  ) {
    super(loggerService, prismaService, configService);
  }

  /**
   * Busca pedidos pendentes do dia anterior e dispara mensagens de lembrete.
   */
  async sendPendingPaymentReminders() {
    const yesterdayStart = startOfDay(subDays(new Date(), 1));
    const yesterdayEnd = endOfDay(subDays(new Date(), 1));
    const todayStart = startOfDay(new Date());
    const beforeToday = subMilliseconds(todayStart, 1);

    // 1️⃣ Buscar pedidos com pagamento pendente (paymentStatus = 'pending')
    const pendingOrders = await this.prisma.orderOnline.findMany({
      where: {
        paymentStatus: 'pending',
        step: { in: ['payment', 'pix', 'card'] },
        createdAt: { lte: beforeToday },
        //createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
        active: true,
      },
      include: {
        customer: true,
      },
    });

    // 2️⃣ Buscar pedidos abandonados antes do pagamento
    const abandonedOrders = await this.prisma.orderOnline.findMany({
      where: {
        step: { in: ['customer', 'order', 'delivery'] },
        createdAt: { lte: beforeToday },
        //createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
        active: true,
      },
      include: {
        customer: true,
      },
    });

    // 3️⃣ Enviar lembrete para cada cliente pendente
    for (const order of pendingOrders) {
      try {
        await this.evolutionNotifications.sendPendingPaymentMessage({
          customerName: order.customer?.name ?? 'cliente',
          phone: order.customer?.phone,
          orderId: order.id,
          isAbandoned: false,
        });
      } catch (error) {
        this.logger.error(
          `Erro ao enviar lembrete de pagamento pendente para ${order.customer?.phone}: ${error}`,
        );
      }
    }

    // 4️⃣ Enviar lembrete para cada cliente que abandonou
    for (const order of abandonedOrders) {
      try {
        await this.evolutionNotifications.sendPendingPaymentMessage({
          customerName: order.customer?.name ?? 'cliente',
          phone: order.customer?.phone,
          orderId: order.id,
          isAbandoned: true,
        });
      } catch (error) {
        this.logger.error(
          `Erro ao enviar lembrete de pedido não concluído para ${order.customer?.phone}: ${error}`,
        );
      }
    }

    this.logger.log(
      `Lembretes enviados: ${pendingOrders.length} pendentes, ${abandonedOrders.length} abandonados.`,
    );
  }
}
