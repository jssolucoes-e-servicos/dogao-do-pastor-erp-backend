// src/modules/dashboard/dashboard.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { DashboardStatsEntity } from 'src/common/entities';
import {
  DeliveryOptionEnum,
  PaymentStatusEnum,
  SiteOrderStepEnum,
} from 'src/common/enums';
import { getActiveEdition } from 'src/common/helpers/edition-helper';
import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';

@Injectable()
export class DashboardService extends BaseService {
  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
  ) {
    super(configService, loggerService, prismaService);
  }

  async getSummary(): Promise<DashboardStatsEntity> {
    const activeEdition = await getActiveEdition(this.prisma);

    if (!activeEdition) {
      throw new NotFoundException('Nenhuma edição ativa encontrada.');
    }

    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

    // 1. Faturamento Total
    const revenueStats = await this.prisma.order.aggregate({
      where: {
        editionId: activeEdition.id,
        paymentStatus: PaymentStatusEnum.PAID,
      },
      _sum: { totalValue: true },
    });

    // 2. Itens Vendidos (Dogs) e Ingredientes
    const paidItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          editionId: activeEdition.id,
          paymentStatus: PaymentStatusEnum.PAID,
        },
      },
      select: { removedIngredients: true },
    });

    // 3. Contagem de Doações
    const totalDonations = await this.prisma.orderItem.count({
      where: {
        order: {
          editionId: activeEdition.id,
          paymentStatus: PaymentStatusEnum.PAID,
          deliveryOption: DeliveryOptionEnum.DONATE,
        },
      },
    });

    // 4. Pedidos em Análise
    const pendingAnalysis = await this.prisma.order.count({
      where: {
        editionId: activeEdition.id,
        siteStep: SiteOrderStepEnum.ANALYSIS,
      },
    });

    // 5. Pedidos Abandonados
    const abandonedOrdersCount = await this.prisma.order.count({
      where: {
        editionId: activeEdition.id,
        paymentStatus: PaymentStatusEnum.PENDING,
        createdAt: { lt: twelveHoursAgo },
        items: { some: {} },
      },
    });

    // 6. Atividade Recente
    const recentOrdersRaw = await this.prisma.order.findMany({
      where: { editionId: activeEdition.id },
      take: 5,
      orderBy: { updatedAt: 'desc' },
    });

    // 7. Ranking de Células (Lógica Manual para evitar erro de tipos)
    const allCells = await this.prisma.cell.findMany({
      select: {
        id: true,
        name: true,
        sellers: { select: { id: true } },
      },
    });

    const paidOrders = await this.prisma.order.findMany({
      where: {
        editionId: activeEdition.id,
        paymentStatus: PaymentStatusEnum.PAID,
      },
      select: { sellerId: true },
    });

    // Processamento do Ranking em memória
    const rankingCells = allCells.map((cell) => {
      const sellerIds = cell.sellers.map((s) => s.id);
      const totalOrders = paidOrders.filter((o) =>
        sellerIds.includes(o.sellerId),
      ).length;

      return {
        name: cell.name,
        total: totalOrders,
      };
    }).sort((a, b) => b.total - a.total);

    // Processamento de Ingredientes
    const ingredientsMap: Record<string, number> = {};
    paidItems.forEach((item) => {
      item.removedIngredients.forEach((ing) => {
        ingredientsMap[ing] = (ingredientsMap[ing] || 0) + 1;
      });
    });

    const totalDogsSold = paidItems.length;

    return {
      editionName: activeEdition.name,
      totalDogsSold,
      availableDogs: activeEdition.limitSale - totalDogsSold,
      totalRevenue: revenueStats._sum.totalValue || 0,
      totalDonations,
      pendingAnalysis,
      abandonedOrdersCount,
      ingredientsStats: Object.entries(ingredientsMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      paymentMethodsStats: [],
      rankingCells,
      recentOrders: recentOrdersRaw.map((o) => ({
        id: o.id,
        customer: o.customerName,
        status: o.status,
        time: o.updatedAt,
      })),
    };
  }
}
