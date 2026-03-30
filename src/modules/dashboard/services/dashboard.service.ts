import { Injectable } from '@nestjs/common';
import { DashboardStatsEntity } from 'src/common/entities';
import {
  DeliveryOptionEnum,
  OrderOriginEnum,
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

  async getSummary(editionId?: string): Promise<DashboardStatsEntity> {
    // Usa a edição passada, ou a ativa, ou a mais recente
    type EditionRow = { id: string; name: string; limitSale: number };
    let edition: EditionRow | null = null;
    if (editionId) {
      edition = await this.prisma.edition.findUnique({
        where: { id: editionId },
        select: { id: true, name: true, limitSale: true },
      });
    }
    if (!edition) {
      edition = (await getActiveEdition(this.prisma)) as EditionRow | null;
    }
    if (!edition) {
      edition = await this.prisma.edition.findFirst({
        orderBy: { productionDate: 'desc' },
        select: { id: true, name: true, limitSale: true },
      });
    }
    if (!edition) {
      return this.emptyStats('Nenhuma edição encontrada');
    }

    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

    const [
      revenueStats,
      paidOrdersData,
      allCells,
      allSellers,
      recentOrdersRaw,
      paidItems,
      pendingItemsCount,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: { editionId: edition.id, paymentStatus: PaymentStatusEnum.PAID },
        _sum: { totalValue: true },
      }),
      this.prisma.order.findMany({
        where: {
          editionId: edition.id,
          paymentStatus: PaymentStatusEnum.PAID,
          origin: { in: [OrderOriginEnum.SITE, OrderOriginEnum.MANUAL, OrderOriginEnum.PDV, OrderOriginEnum.APP] },
        },
        select: { 
          sellerId: true, 
          paymentType: true, 
          deliveryOption: true,
          partnerId: true,
          partner: { select: { name: true } }
        },
      }),
      this.prisma.cell.findMany({
        select: { id: true, name: true, sellers: { select: { id: true } } },
      }),
      this.prisma.seller.findMany({
        select: { id: true, name: true },
      }),
      this.prisma.order.findMany({
        where: { 
          editionId: edition.id,
          customer: { firstRegister: false } 
        },
        take: 5,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.orderItem.findMany({
        where: { order: { editionId: edition.id, paymentStatus: PaymentStatusEnum.PAID } },
        select: { removedIngredients: true },
      }),
      this.prisma.orderItem.count({
        where: {
          order: {
            editionId: edition.id,
            paymentStatus: PaymentStatusEnum.PENDING,
            totalValue: { gt: 0 },
          },
        },
      }),
    ]);

    const rankingCells = allCells
      .filter((cell) => cell.name !== 'Igreja Viva em Células')
      .map((cell) => {
        const sellerIds = cell.sellers.map((s) => s.id);
        const total = paidOrdersData.filter((o) => sellerIds.includes(o.sellerId)).length;
        return { name: cell.name, total };
      })
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total).slice(0, 5);

    const rankingSellers = allSellers
      .map((s) => ({
        name: s.name,
        total: paidOrdersData.filter((o) => o.sellerId === s.id).length,
      }))
      .filter((i) => i.total > 0)
      .sort((a, b) => b.total - a.total).slice(0, 5);

    const logisticsMap: Record<string, number> = {};
    const paymentMethodsMap: Record<string, number> = {};
    const partnersMap: Record<string, number> = {};

    paidOrdersData.forEach((order) => {
      const delivery = order.deliveryOption || 'OUTROS';
      logisticsMap[delivery] = (logisticsMap[delivery] || 0) + 1;

      const method = order.paymentType || 'OUTROS';
      paymentMethodsMap[method] = (paymentMethodsMap[method] || 0) + 1;

      if (order.deliveryOption === DeliveryOptionEnum.DONATE && order.partner?.name) {
        partnersMap[order.partner.name] = (partnersMap[order.partner.name] || 0) + 1;
      }
    });

    const ingredientsMap: Record<string, number> = {};
    paidItems.forEach((item) => {
      item.removedIngredients.forEach((ing) => {
        ingredientsMap[ing] = (ingredientsMap[ing] || 0) + 1;
      });
    });

    return {
      editionName: edition.name,
      totalDogsSold: paidItems.length,
      availableDogs: edition.limitSale - paidItems.length,
      pendingDogs: pendingItemsCount,
      totalRevenue: revenueStats._sum.totalValue || 0,
      totalDonations: paidOrdersData.filter(o => o.deliveryOption === DeliveryOptionEnum.DONATE).length,
      pendingAnalysis: await this.prisma.order.count({ where: { editionId: edition.id, siteStep: SiteOrderStepEnum.ANALYSIS } }),
      abandonedOrdersCount: await this.prisma.order.count({ where: { editionId: edition.id, paymentStatus: PaymentStatusEnum.PENDING, createdAt: { lt: twelveHoursAgo }, items: { some: {} } } }),
      ingredientsStats: Object.entries(ingredientsMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      paymentMethodsStats: Object.entries(paymentMethodsMap).map(([method, count]) => ({ method, count })),
      rankingCells,
      rankingSellers,
      logisticsStats: Object.entries(logisticsMap).map(([label, value]) => ({ label, value })),
      donationsByPartner: Object.entries(partnersMap).map(([label, value]) => ({ label, value })),
      recentOrders: recentOrdersRaw.map((o) => ({
        id: o.id,
        customer: o.customerName,
        status: o.status,
        time: o.updatedAt,
      })),
    };
  }

  private emptyStats(editionName: string): DashboardStatsEntity {
    return {
      editionName,
      totalDogsSold: 0,
      availableDogs: 0,
      pendingDogs: 0,
      totalRevenue: 0,
      totalDonations: 0,
      pendingAnalysis: 0,
      abandonedOrdersCount: 0,
      ingredientsStats: [],
      paymentMethodsStats: [],
      rankingCells: [],
      rankingSellers: [],
      logisticsStats: [],
      donationsByPartner: [],
      recentOrders: [],
    };
  }
}