import {
  ConfigService,
  LoggerService,
  PrismaService,
} from '@/common/helpers/importer-helper';
import { BaseService } from '@/common/services/base.service';
import { EvolutionNotificationsService } from '@/modules/evolution/services/evolution-notifications.service';
import { Injectable } from '@nestjs/common';
import { SellerReportCache } from '../interfaces/SellerReportCache.interface';

interface ISummary {
  Seller: string;
  Cell: string;
  Network: string;
  Orders: number;
  Dogs: number;
  Total: number;
  sellerId?: string | null | undefined;
  cellId?: string | null | undefined;
}

@Injectable()
export class ReportsService extends BaseService {
  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    configService: ConfigService,
    private readonly evolutionNotifications: EvolutionNotificationsService,
  ) {
    super(loggerService, prismaService, configService);
  }

  /**
   * Gera o relatório consolidado de vendas por vendedor (cumulative)
   */
  async generateReport(): Promise<SellerReportCache[]> {
    // 1) aggregate orders per seller (count orders and sum values)
    const orderAggregates = await this.prisma.orderOnline.groupBy({
      by: ['sellerId'],
      where: {
        paymentStatus: 'approved',
        active: true,
      },
      _count: { id: true },
      _sum: { valueTotal: true },
    });

    const sellerIds = orderAggregates.map((o) => o.sellerId).filter(Boolean);

    if (sellerIds.length === 0) return [];

    // 2) get sellers and their cell/network in batch
    const sellers = await this.prisma.seller.findMany({
      where: { id: { in: sellerIds } },
      select: {
        id: true,
        name: true,
        phone: true,
        cell: {
          select: {
            id: true,
            name: true,
            phone: true, // leader phone if exists
            network: { select: { name: true } },
          },
        },
      },
    });

    // 3) get all orders for these sellers to map order -> seller
    const sellerOrders = await this.prisma.orderOnline.findMany({
      where: {
        sellerId: { in: sellerIds },
        paymentStatus: 'approved',
        active: true,
      },
      select: { id: true, sellerId: true },
    });

    // 4) get item counts per order in batch
    const itemCounts = await this.prisma.orderOnlineItem.groupBy({
      by: ['orderOnlineId'],
      _count: { id: true },
      where: {
        orderOnlineId: { in: sellerOrders.map((o) => o.id) },
      },
    });

    const itemsPerOrder: Record<string, number> = Object.fromEntries(
      itemCounts.map((g) => [g.orderOnlineId, g._count.id]),
    );

    // 5) sum dogs per seller by iterating sellerOrders
    const dogsPerSeller: Record<string, number> = {};
    for (const o of sellerOrders) {
      dogsPerSeller[o.sellerId] =
        (dogsPerSeller[o.sellerId] || 0) + (itemsPerOrder[o.id] || 0);
    }

    // 6) build reports array by joining aggregates + seller data
    const reports: SellerReportCache[] = [];

    for (const agg of orderAggregates) {
      const seller = sellers.find((s) => s.id === agg.sellerId);
      if (!seller) continue;

      reports.push({
        sellerId: seller.id,
        Seller: seller.name,
        Cell: seller.cell?.name || 'No Cell',
        cellId: seller.cell?.id ?? null,
        Network: seller.cell?.network?.name || 'No Network',
        Orders: agg._count.id,
        Dogs: dogsPerSeller[seller.id] || 0,
        Total: agg._sum.valueTotal ?? 0,
      });
    }

    return reports;
  }

  // compara cache antigo com novo (summary tem Seller/Cell/Network/Orders/Dogs/Total)
  private isChanged(
    oldSummary: ISummary | null | undefined,
    newSummary: ISummary,
  ): boolean {
    if (!oldSummary) return true;
    return (
      oldSummary.Orders !== newSummary.Orders ||
      oldSummary.Dogs !== newSummary.Dogs ||
      Math.abs((oldSummary.Total ?? 0) - (newSummary.Total ?? 0)) > 0.0001
    );
  }

  // create or update cache (não usa upsert com id 'new')
  private async saveCache(
    type: 'seller' | 'cell',
    refId: string,
    summary: ISummary,
    cacheId?: string,
  ) {
    const sumarySave = {
      Seller: summary.Seller,
      Cell: summary.Cell,
      Network: summary.Network,
      Orders: summary.Orders,
      Dogs: summary.Dogs,
      Total: summary.Total,
    };

    if (cacheId) {
      await this.prisma.dailyReportSoldsCache.update({
        where: { id: cacheId },
        data: {
          summary: sumarySave,
          updatedAt: new Date(),
          sentAt: new Date(),
        },
      });
    } else {
      await this.prisma.dailyReportSoldsCache.create({
        data: { type, refId, summary: sumarySave, sentAt: new Date() },
      });
    }
  }

  /**
   * Compara com o último cache e envia relatórios atualizados
   */
  async sendReportsIfChanged() {
    const reports = await this.generateReport();
    this.logger.log(`Generating ${reports.length} seller reports...`);

    if (reports.length === 0) {
      this.logger.log('No reports to process.');
      return;
    }

    // --- sellers batch load (by sellerId) ---
    const sellerIds = reports.map((r) => r.sellerId);
    const sellers = await this.prisma.seller.findMany({
      where: { id: { in: sellerIds } },
      include: {
        cell: {
          select: { id: true, name: true, phone: true },
        },
      },
    });
    const sellerMap = Object.fromEntries(sellers.map((s) => [s.id, s]));

    // --- existing caches for sellers ---
    const existingSellerCaches =
      await this.prisma.dailyReportSoldsCache.findMany({
        where: { type: 'seller', refId: { in: sellerIds } },
      });
    const sellerCacheMap = Object.fromEntries(
      existingSellerCaches.map((c) => [c.refId, c]),
    );

    // --- process sellers ---
    for (const r of reports) {
      const seller = sellerMap[r.sellerId];
      if (!seller) continue;
      if (!seller.phone) {
        this.logger.log(`Seller ${seller.name} has no phone, skipping.`);
        continue;
      }

      const summary: ISummary = {
        Seller: r.Seller,
        Cell: r.Cell,
        Network: r.Network,
        Orders: r.Orders,
        Dogs: r.Dogs,
        Total: r.Total,
        sellerId: r.sellerId,
        cellId: r.cellId ?? undefined,
      };

      const cache = sellerCacheMap[seller.id];
      if (!this.isChanged(cache?.summary, summary)) {
        this.logger.log(
          `No change for seller ${seller.name}, skipping message.`,
        );
        continue;
      }

      // send
      await this.evolutionNotifications.sendSellerReport(seller.phone, r);

      // save cache
      await this.saveCache('seller', seller.id, summary, cache?.id);
    }

    // --- build cell aggregates from reports ---
    const cellBuckets: Record<
      string,
      {
        Orders: number;
        Dogs: number;
        Total: number;
        sellers: SellerReportCache[];
      }
    > = {};
    for (const r of reports) {
      const key = r.Cell || 'No Cell';
      if (!cellBuckets[key])
        cellBuckets[key] = { Orders: 0, Dogs: 0, Total: 0, sellers: [] };
      cellBuckets[key].Orders += r.Orders;
      cellBuckets[key].Dogs += r.Dogs;
      cellBuckets[key].Total += r.Total;
      cellBuckets[key].sellers.push(r);
    }

    const cellNames = Object.keys(cellBuckets);
    if (cellNames.length === 0) {
      this.logger.log('No cells to process.');
      return;
    }

    // --- fetch cells by name and their leader user.phone (user is the leader link in your schema) ---
    const cells = await this.prisma.cell.findMany({
      where: { name: { in: cellNames } },
    });
    const cellMap = Object.fromEntries(cells.map((c) => [c.name, c]));

    const cellIds = cells.map((c) => c.id);
    const existingCellCaches = await this.prisma.dailyReportSoldsCache.findMany(
      {
        where: { type: 'cell', refId: { in: cellIds } },
      },
    );
    const cellCacheMap = Object.fromEntries(
      existingCellCaches.map((c) => [c.refId, c]),
    );

    for (const [cellName, bucket] of Object.entries(cellBuckets)) {
      const cell = cellMap[cellName];
      if (!cell) {
        this.logger.log(
          `Cell ${cellName} not found in DB, skipping leader notification.`,
        );
        continue;
      }

      const leaderPhone = cell.phone;
      if (!leaderPhone) {
        this.logger.log(`Cell ${cellName} has no leader phone, skipping.`);
        continue;
      }

      const summary: ISummary = {
        Seller: '', // not used for cell cache but kept for shape
        Cell: cellName,
        Network: cell.networkId ? '' : '', // network name not essential here (we could fetch)
        Orders: bucket.Orders,
        Dogs: bucket.Dogs,
        Total: bucket.Total,
        cellId: cell.id,
      };

      const cache = cellCacheMap[cell.id];
      if (!this.isChanged(cache?.summary, summary)) {
        this.logger.log(`No change for cell ${cellName}, skipping message.`);
        continue;
      }

      // send cell summary
      await this.evolutionNotifications.sendCellReport(leaderPhone, {
        Orders: bucket.Orders,
        Dogs: bucket.Dogs,
        Total: bucket.Total,
        sellers: bucket.sellers,
      });

      // save cache
      await this.saveCache('cell', cell.id, summary, cache?.id);
    }

    this.logger.log('Daily report notifications completed successfully.');
  }
}
