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

    const [
      revenueStats,
      paidOrdersData,
      allCells,
      allSellers,
      recentOrdersRaw,
      paidItems,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: { editionId: activeEdition.id, paymentStatus: PaymentStatusEnum.PAID },
        _sum: { totalValue: true },
      }),
      this.prisma.order.findMany({
        where: { editionId: activeEdition.id, paymentStatus: PaymentStatusEnum.PAID },
        select: { 
          sellerId: true, 
          paymentType: true, 
          deliveryOption: true,
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
          editionId: activeEdition.id,
          customer: { firstRegister: false } 
        },
        take: 5,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.orderItem.findMany({
        where: { order: { editionId: activeEdition.id, paymentStatus: PaymentStatusEnum.PAID } },
        select: { removedIngredients: true },
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

      if (order.deliveryOption === DeliveryOptionEnum.DONATE && order.partner) {
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
      editionName: activeEdition.name,
      totalDogsSold: paidItems.length,
      availableDogs: activeEdition.limitSale - paidItems.length,
      totalRevenue: revenueStats._sum.totalValue || 0,
      totalDonations: paidOrdersData.filter(o => o.deliveryOption === DeliveryOptionEnum.DONATE).length,
      pendingAnalysis: await this.prisma.order.count({ where: { editionId: activeEdition.id, siteStep: SiteOrderStepEnum.ANALYSIS } }),
      abandonedOrdersCount: await this.prisma.order.count({ where: { editionId: activeEdition.id, paymentStatus: PaymentStatusEnum.PENDING, createdAt: { lt: twelveHoursAgo }, items: { some: {} } } }),
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
}