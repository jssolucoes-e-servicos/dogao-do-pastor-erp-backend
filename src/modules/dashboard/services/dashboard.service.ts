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
      allNetworks,
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
          origin: true,
          partner: { select: { name: true } },
          _count: { select: { items: true } }
        },
      }),
      this.prisma.cell.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true, sellers: { select: { id: true } } },
      }),
      this.prisma.seller.findMany({
        select: { id: true, name: true },
      }),
      this.prisma.cellNetwork.findMany({
        where: { deletedAt: null },
        select: { 
          id: true, 
          name: true, 
          cells: { 
            where: { deletedAt: null },
            select: { 
              id: true, 
              sellers: { select: { id: true } } 
            } 
          } 
        },
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

    const rankingNetworks = allNetworks
      .filter((n) => n.name !== 'Igreja Viva em Células' && n.id !== 'clz8x9r1n00193b6p8u2v1w0x')
      .map((n) => {
        const sellerIds = (n.cells || []).flatMap((c) => (c.sellers || []).map((s) => s.id));
        const total = paidOrdersData
          .filter((o) => sellerIds.includes(o.sellerId) && [OrderOriginEnum.SITE, OrderOriginEnum.APP].includes(o.origin as any))
          .reduce((acc, o) => acc + (o._count?.items || 0), 0);
        return { name: n.name, total };
      })
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total).slice(0, 5);

    const rankingCells = allCells
      .filter((cell) => cell.name !== 'Igreja Viva em Células')
      .map((cell) => {
        const sellerIds = cell.sellers.map((s) => s.id);
        const total = paidOrdersData
          .filter((o) => sellerIds.includes(o.sellerId) && [OrderOriginEnum.SITE, OrderOriginEnum.APP].includes(o.origin as any))
          .reduce((acc, o) => acc + (o._count?.items || 0), 0);
        return { name: cell.name, total };
      })
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total).slice(0, 5);

    const rankingSellers = allSellers
      .filter((s) => s.id !== 'clz8x9r1n001p3b6p6e7f8g9h') // Exclui o Vendedor Web Site
      .map((s) => ({
        name: s.name,
        total: paidOrdersData
          .filter((o) => o.sellerId === s.id && [OrderOriginEnum.SITE, OrderOriginEnum.APP].includes(o.origin as any))
          .reduce((acc, o) => acc + (o._count?.items || 0), 0),
      }))
      .filter((i) => i.total > 0)
      .sort((a, b) => b.total - a.total).slice(0, 5);

    const logisticsMap: Record<string, number> = {};
    const paymentMethodsMap: Record<string, number> = {};
    const partnersMap: Record<string, number> = {};

    paidOrdersData.forEach((order) => {
      const itemsCount = order._count?.items || 0;

      const delivery = order.deliveryOption || 'OUTROS';
      logisticsMap[delivery] = (logisticsMap[delivery] || 0) + itemsCount;

      const method = order.paymentType || 'OUTROS';
      paymentMethodsMap[method] = (paymentMethodsMap[method] || 0) + itemsCount;

      if (order.deliveryOption === DeliveryOptionEnum.DONATE && order.partner?.name) {
        partnersMap[order.partner.name] = (partnersMap[order.partner.name] || 0) + itemsCount;
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
      totalDonations: paidOrdersData
        .filter(o => o.deliveryOption === DeliveryOptionEnum.DONATE)
        .reduce((acc, o) => acc + (o._count?.items || 0), 0),
      pendingAnalysis: await this.prisma.order.count({ where: { editionId: edition.id, siteStep: SiteOrderStepEnum.ANALYSIS } }),
      abandonedOrdersCount: await this.prisma.order.count({ where: { editionId: edition.id, paymentStatus: PaymentStatusEnum.PENDING, createdAt: { lt: twelveHoursAgo }, items: { some: {} } } }),
      ingredientsStats: Object.entries(ingredientsMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      paymentMethodsStats: Object.entries(paymentMethodsMap).map(([method, count]) => ({ method, count })),
      rankingNetworks,
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

  /** Resumo personalizado: dados globais da edição + dados da célula/seller do usuário */
  async getMySummary(user: any, editionId?: string) {
    const edition = editionId
      ? await this.prisma.edition.findUnique({ where: { id: editionId }, select: { id: true, name: true, limitSale: true } })
      : await getActiveEdition(this.prisma) as { id: string; name: string; limitSale: number } | null;

    if (!edition) return { editionName: 'Sem edição ativa', global: null, cell: null, seller: null };

    // ── Global ─────────────────────────────────────────────────────────────
    const [globalSoldCount, globalPendingCount] = await Promise.all([
      this.prisma.orderItem.count({
        where: { order: { editionId: edition.id, paymentStatus: PaymentStatusEnum.PAID } },
      }),
      this.prisma.orderItem.count({
        where: { order: { editionId: edition.id, paymentStatus: PaymentStatusEnum.PENDING, totalValue: { gt: 0 } } },
      }),
    ]);

    const global = {
      editionName: edition.name,
      dogsSold: globalSoldCount,
      dogsGoal: edition.limitSale,
      dogsPending: globalPendingCount,
      percentReached: edition.limitSale > 0 ? Math.round((globalSoldCount / edition.limitSale) * 100) : 0,
    };

    // ── Célula: usa leaderCellId do JWT, com fallback buscando no banco ────
    let cell: { cellName: string; dogsSold: number; dogsPending: number; ranking: { name: string; total: number }[] } | null = null;

    // Tenta leaderCellId do JWT primeiro, senão busca no banco
    let leaderCellId = user?.leaderCellId;
    if (!leaderCellId && user?.id) {
      const contributor = await this.prisma.contributor.findUnique({
        where: { id: user.id },
        select: { cells: { select: { id: true }, where: { active: true }, take: 1 } },
      });
      leaderCellId = contributor?.cells[0]?.id ?? null;
    }

    if (leaderCellId) {
      const cellData = await this.prisma.cell.findUnique({
        where: { id: leaderCellId },
        select: { id: true, name: true, sellers: { select: { id: true } } },
      });

      if (cellData) {
        const sellerIds = cellData.sellers.map(s => s.id);
        const [cellSold, cellPending, cellSellers] = await Promise.all([
          this.prisma.orderItem.count({
            where: { order: { editionId: edition.id, paymentStatus: PaymentStatusEnum.PAID, sellerId: { in: sellerIds }, origin: { in: [OrderOriginEnum.SITE, OrderOriginEnum.APP] } } },
          }),
          this.prisma.orderItem.count({
            where: { order: { editionId: edition.id, paymentStatus: PaymentStatusEnum.PENDING, sellerId: { in: sellerIds }, totalValue: { gt: 0 }, origin: { in: [OrderOriginEnum.SITE, OrderOriginEnum.APP] } } },
          }),
          this.prisma.seller.findMany({
            where: { id: { in: sellerIds } },
            select: { id: true, name: true },
          }),
        ]);

        const rankingData = await this.prisma.order.findMany({
          where: { 
            editionId: edition.id, 
            paymentStatus: PaymentStatusEnum.PAID, 
            sellerId: { in: sellerIds },
            origin: { in: [OrderOriginEnum.SITE, OrderOriginEnum.APP] }
          },
          select: { sellerId: true, _count: { select: { items: true } } },
        });

        const rankingMap: Record<string, number> = {};
        rankingData.forEach(o => { rankingMap[o.sellerId] = (rankingMap[o.sellerId] || 0) + (o._count?.items || 0); });

        cell = {
          cellName: cellData.name,
          dogsSold: cellSold,
          dogsPending: cellPending,
          ranking: cellSellers
            .map(s => ({ name: s.name, total: rankingMap[s.id] || 0 }))
            .filter(s => s.total > 0)
            .sort((a, b) => b.total - a.total),
        };
      }
    }

    // ── Seller: dados do próprio vendedor ─────────────────────────────────
    let seller: { dogsSold: number; dogsPending: number } | null = null;

    // Tenta sellerId do JWT, com fallback buscando no banco
    let sellerId = user?.sellerId;
    if (!sellerId && user?.id) {
      const contributor = await this.prisma.contributor.findUnique({
        where: { id: user.id },
        select: { sellers: { select: { id: true }, where: { active: true }, take: 1 } },
      });
      sellerId = contributor?.sellers[0]?.id ?? null;
    }

    if (sellerId) {
      const [myDogs, myPending] = await Promise.all([
        this.prisma.orderItem.count({
          where: { order: { editionId: edition.id, paymentStatus: PaymentStatusEnum.PAID, sellerId, origin: { in: [OrderOriginEnum.SITE, OrderOriginEnum.APP] } } },
        }),
        this.prisma.orderItem.count({
          where: { order: { editionId: edition.id, paymentStatus: PaymentStatusEnum.PENDING, sellerId, totalValue: { gt: 0 }, origin: { in: [OrderOriginEnum.SITE, OrderOriginEnum.APP] } } },
        }),
      ]);
      seller = { dogsSold: myDogs, dogsPending: myPending };
    }

    return { global, cell, seller };
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
      rankingNetworks: [],
      rankingCells: [],
      rankingSellers: [],
      logisticsStats: [],
      donationsByPartner: [],
      recentOrders: [],
    };
  }
}