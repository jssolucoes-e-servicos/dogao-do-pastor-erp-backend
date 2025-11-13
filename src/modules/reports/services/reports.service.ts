import {
  ConfigService,
  LoggerService,
  PrismaService,
} from '@/common/helpers/importer-helper';
import { BaseService } from '@/common/services/base.service';
import { EvolutionNotificationsService } from '@/modules/evolution/services/evolution-notifications.service';
import { Injectable } from '@nestjs/common';
import { ICountSoldsWithRank, IGetSaleBySeller } from 'src/common/interfaces';
import { SendReportByTagDTO } from '../dto/send-report-by-tag.dto';
import { SendReportWhastappDTO } from '../dto/send-report-whatsapp.dto';
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

  async getCountAllSolds(): Promise<ICountSoldsWithRank> {
    const agg = await this.prisma.orderOnline.aggregate({
      where: {
        paymentStatus: 'approved',
        active: true,
      },
      _sum: {
        quantity: true,
        valueTotal: true,
      },
    });

    const totalCount = agg._sum?.quantity ?? 0;
    const totalValue = agg._sum?.valueTotal ?? 0;

    // --- Ranking de vendedores ---
    const sellerSales = await this.prisma.orderOnline.groupBy({
      by: ['sellerId'],
      where: {
        paymentStatus: 'approved',
        active: true,
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
    });

    const sellers = await this.prisma.seller.findMany({
      where: {
        id: { in: sellerSales.map((s) => s.sellerId) },
      },
      select: { id: true, name: true },
    });

    const rank_sellers = sellerSales.map((s) => ({
      name: sellers.find((x) => x.id === s.sellerId)?.name || 'Sem vendedor',
      quantity: s._sum.quantity ?? 0,
    }));

    // --- Ranking de células ---
    const sellersWithCells = await this.prisma.seller.findMany({
      where: {
        id: { in: sellerSales.map((s) => s.sellerId) },
      },
      select: {
        id: true,
        cellId: true,
      },
    });

    const cellQuantities: Record<string, number> = {};

    // soma quantidade de cada célula
    for (const sale of sellerSales) {
      const seller = sellersWithCells.find((x) => x.id === sale.sellerId);
      if (!seller?.cellId) continue;
      cellQuantities[seller.cellId] =
        (cellQuantities[seller.cellId] ?? 0) + (sale._sum.quantity ?? 0);
    }

    const cells = await this.prisma.cell.findMany({
      where: { id: { in: Object.keys(cellQuantities) } },
      select: { id: true, name: true },
    });

    const rank_cells = Object.entries(cellQuantities)
      .map(([cellId, quantity]) => ({
        name: cells.find((c) => c.id === cellId)?.name || 'Sem célula',
        quantity,
      }))
      .sort((a, b) => b.quantity - a.quantity);

    return {
      totalCount,
      totalValue,
      rank_cells,
      rank_sellers,
    };
  }

  async sendSalesReportToWhatsapp(body: SendReportWhastappDTO): Promise<void> {
    try {
      const report = await this.getCountAllSolds();
      await this.evolutionNotifications.sendSoldsRanking(body.phone, report);
    } catch (error) {
      console.error('Erro ao enviar relatório pelo WhatsApp:', error);
      throw new Error('Falha ao enviar relatório de vendas via WhatsApp');
    }
  }

  async getSalesBySellerTag(sellerTag: string): Promise<IGetSaleBySeller> {
    const orders = await this.prisma.orderOnline.findMany({
      where: {
        sellerTag,
        paymentStatus: 'approved', // ou "payd", dependendo de como está salvo
        active: true,
      },
      include: {
        customer: true,
        seller: true,
      },
    });

    if (!orders.length) {
      /* throw new Error(
        `Nenhuma venda encontrada para o vendedor com tag ${sellerTag}`,
      ); */
      return {
        sellerName: `Nenhuma venda com a tag: ${sellerTag}`,
        sales: [],
        totalDogs: 0,
      };
    }

    const sellerName = orders[0].seller?.name ?? 'Vendedor não identificado';

    // Agrupa por cliente
    const customerMap: Record<
      string,
      { customerName: string; quantity: number }
    > = {};

    for (const order of orders) {
      const customerName = order.customer?.name ?? 'Cliente não identificado';
      const quantity = order.quantity ?? 0;

      if (!customerMap[customerName]) {
        customerMap[customerName] = { customerName, quantity };
      } else {
        customerMap[customerName].quantity += quantity;
      }
    }

    const sales = Object.values(customerMap).sort(
      (a, b) => b.quantity - a.quantity,
    );
    const totalDogs = sales.reduce((acc, s) => acc + s.quantity, 0);

    return {
      sellerName,
      sales,
      totalDogs,
    };
  }

  async sendSalesBySellerTagToWhatsapp(
    body: SendReportByTagDTO,
  ): Promise<void> {
    try {
      const report = await this.getSalesBySellerTag(body.tag);
      if (report.totalDogs > 0) {
        await this.evolutionNotifications.sendReportSellerTag(
          body.phone,
          report,
        );
      } else {
        throw new Error('Tag sem venda');
      }
    } catch (error) {
      console.error('Erro ao enviar relatório do vendedor:', error);
      throw new Error('Falha ao enviar relatório via WhatsApp');
    }
  }

  async sendAllSellersSalesReports(): Promise<{
    totalSellers: number;
    success: number;
    failed: number;
  }> {
    const sellers = await this.prisma.seller.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        tag: true,
      },
    });

    if (!sellers.length) {
      throw new Error('Nenhum vendedor ativo com telefone e tag encontrado');
    }

    let success = 0;
    let failed = 0;

    // envia em paralelo controlando a concorrência (Promise.allSettled)
    await Promise.allSettled(
      sellers.map(async (seller) => {
        try {
          await this.sendSalesBySellerTagToWhatsapp({
            tag: seller.tag,
            phone: seller.phone,
          });
          success++;
        } catch (err) {
          this.logger.error(
            `Erro ao enviar relatório para ${seller.name}: ${err.message}`,
          );
          failed++;
        }
      }),
    );

    return {
      totalSellers: sellers.length,
      success,
      failed,
    };
  }

  /* async generateSalesReportPdf(): Promise<{ url: string }> {
    try {
      const report = await this.getCountAllSolds();

      // Cria PDF
      const doc = new PDFDocument({ margin: 40 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      const endPromise = new Promise<Buffer>((resolve) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
      });

      doc.fontSize(20).text('Relatório de Vendas', { align: 'center' });
      doc.moveDown();

      doc.fontSize(14).text(`Total de Dogs Vendidos: ${report.totalCount}`);
      doc.text(`Valor Total: R$ ${report.totalValue.toFixed(2)}`);
      doc.moveDown();

      doc.fontSize(16).text('Ranking de Células', { underline: true });
      report.rank_cells.forEach((c, i) => {
        doc.fontSize(12).text(`${i + 1}. ${c.name} — ${c.quantity}`);
      });
      doc.moveDown();

      doc.fontSize(16).text('Ranking de Vendedores', { underline: true });
      report.rank_sellers.forEach((s, i) => {
        doc.fontSize(12).text(`${i + 1}. ${s.name} — ${s.quantity}`);
      });

      doc.end();

      const pdfBuffer = await endPromise;
      const fileName = `relatorio-vendas-${Date.now()}.pdf`;

      const file = await this.uploadService.uploadFile(
        pdfBuffer,
        fileName,
        'application/pdf',
      );

      return { url: file.url };
    } catch (error) {
      console.error('Erro ao gerar relatório PDF:', error);
      throw new Error('Falha ao gerar PDF de relatório de vendas');
    }
  } */
}
