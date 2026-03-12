import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { BaseService } from 'src/common/services/base.service';
import { N8nService } from 'src/modules/n8n/services/n8n.service';
import { PaymentStatusEnum } from 'src/common/enums';
import { getActiveEdition } from 'src/common/helpers/edition-helper';
import { MW_CellDailyReport, MW_GlobalRankingReport, MW_SellerDailyReport, MW_NetworkDailyReport } from 'src/common/messages';
import { ErrorNotificationService } from 'src/common/services/error-notification.service';

export interface ISellerReport {
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerTag: string;
  cellName: string;
  cellId: string | null;
  cellLeaderName: string;
  cellLeaderPhone: string;
  networkId: string | null;
  networkName: string;
  supervisorName: string;
  supervisorPhone: string;
  totalDogs: number;
  totalValue: number;
}

@Injectable()
export class RankingReportService extends BaseService {
  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
    private readonly n8nService: N8nService,
    private readonly errorNotificationService: ErrorNotificationService,
  ) {
    super(configService, loggerService, prismaService);
  }

  private isChanged(cache: any, newDogs: number, newTotal: number): boolean {
    if (!cache) return true;
    return (
      cache.dogs !== newDogs ||
      Math.abs(Number(cache.total) - newTotal) > 0.0001
    );
  }

  private async saveCache(
    type: string,
    refId: string,
    seller: string,
    cell: string,
    network: string,
    dogs: number,
    total: number,
    cacheId?: string,
  ) {
    if (cacheId) {
      await this.prisma.dailyReportSoldsCache.update({
        where: { id: cacheId },
        data: {
          seller,
          cell,
          network,
          dogs,
          total,
          updatedAt: new Date(),
          sentAt: new Date(),
        },
      });
    } else {
      await this.prisma.dailyReportSoldsCache.create({
        data: {
          type,
          refId,
          seller,
          cell,
          network,
          dogs,
          total,
          sentAt: new Date(),
        },
      });
    }
  }

  /**
   * Pega o total vendido de cada vendedor (incluindo o celular/líder)
   */
  async getDailySalesReport() {
    // 1) Descobre a Edição Ativa
    const activeEdition = await getActiveEdition(this.prisma);
    if (!activeEdition) {
      throw new NotFoundException('Sem edição ativa para extrair relatórios.');
    }

    // 2) Agrupa Pedidos por Vendedor (Contabiliza apenas os Pagos e Ativos)
    const orderAggregates = await this.prisma.order.groupBy({
      by: ['sellerId'],
      where: {
        editionId: activeEdition.id,
        paymentStatus: PaymentStatusEnum.PAID,
        active: true,
      },
      _sum: { totalValue: true },
    });

    const sellerIds = orderAggregates
      .map((o) => o.sellerId)
      .filter(Boolean) as string[];

    if (sellerIds.length === 0) return [];

    // 3) Busca os Detalhes dos Vendedores
    const sellers = await this.prisma.seller.findMany({
      where: { id: { in: sellerIds } },
      select: {
        id: true,
        name: true,
        tag: true,
        contributor: {
          select: { phone: true },
        },
        cell: {
          select: {
            id: true,
            name: true,
            leader: {
              select: { name: true, phone: true },
            },
            network: {
              select: {
                id: true,
                name: true,
                supervisor: {
                  select: { name: true, phone: true }
                }
              }
            }
          },
        },
      },
    });

    // 4) Busca os itens de cada pedido para contar a quantidade total de "Dogs" vendidos por cada Vendedor
    const sellerOrders = await this.prisma.order.findMany({
      where: {
        editionId: activeEdition.id,
        sellerId: { in: sellerIds },
        paymentStatus: PaymentStatusEnum.PAID,
        active: true,
      },
      select: { id: true, sellerId: true },
    });

    const itemCounts = await this.prisma.orderItem.groupBy({
      by: ['orderId'],
      _count: { id: true },
      where: {
        orderId: { in: sellerOrders.map((o) => o.id) },
      },
    });

    const itemsPerOrder: Record<string, number> = Object.fromEntries(
      itemCounts.map((g) => [g.orderId, g._count.id]),
    );

    // Soma dogs por vendedor
    const dogsPerSeller: Record<string, number> = {};
    for (const o of sellerOrders) {
      dogsPerSeller[o.sellerId!] =
        (dogsPerSeller[o.sellerId!] || 0) + (itemsPerOrder[o.id] || 0);
    }

    // 5) Monta o array final de relatórios para todos os Vendedores Ativos
    const reports: ISellerReport[] = [];
    for (const agg of orderAggregates) {
      const seller = sellers.find((s) => s.id === agg.sellerId);
      if (!seller) continue;

      reports.push({
        sellerId: seller.id,
        sellerName: seller.name,
        sellerPhone: seller.contributor?.phone || '',
        sellerTag: seller.tag,
        cellName: seller.cell?.name || 'Sem Célula',
        cellId: seller.cell?.id || null,
        cellLeaderName: seller.cell?.leader?.name || '',
        cellLeaderPhone: seller.cell?.leader?.phone || '',
        networkId: seller.cell?.network?.id || null,
        networkName: seller.cell?.network?.name || 'Sem Rede',
        supervisorName: seller.cell?.network?.supervisor?.name || '',
        supervisorPhone: seller.cell?.network?.supervisor?.phone || '',
        totalDogs: dogsPerSeller[seller.id] || 0,
        totalValue: agg._sum.totalValue || 0,
      });
    }

    return reports;
  }

  /**
   * Agrupa as vendas de Vendedores pelas suas respectivas Células
   */
  async getDailySalesReportByCell() {
    const sellerReports = await this.getDailySalesReport();
    
    const cellBuckets: Record<
      string,
      {
        cellId: string;
        cellName: string;
        leaderName: string;
        leaderPhone: string;
        dogsTotal: number;
        valueTotal: number;
        sellers: any[];
      }
    > = {};

    for (const r of sellerReports) {
      const key = r.cellName || 'Nenhuma Célula';
      
      if (!cellBuckets[key]) {
        cellBuckets[key] = {
          cellId: r.cellId || '',
        cellName: key,
        leaderName: r.cellLeaderName,
        leaderPhone: r.cellLeaderPhone,
        dogsTotal: 0,
        valueTotal: 0,
        sellers: [],
        };
      }
      
      cellBuckets[key].dogsTotal += r.totalDogs;
      cellBuckets[key].valueTotal += Number(r.totalValue);
      cellBuckets[key].sellers.push({
        name: r.sellerName,
        totalDogs: r.totalDogs,
        totalValue: Number(r.totalValue)
      });
    }

    return Object.values(cellBuckets);
  }

  /**
   * Agrupa as vendas de Vendedores pelas suas respectivas Redes (Supervisores)
   */
  async getDailySalesReportByNetwork() {
    const sellerReports = await this.getDailySalesReport();
    
    const networkBuckets: Record<
      string,
      {
        networkId: string;
        networkName: string;
        supervisorName: string;
        supervisorPhone: string;
        dogsTotal: number;
        valueTotal: number;
        cells: Record<string, { name: string; totalDogs: number }>;
      }
    > = {};

    for (const r of sellerReports) {
      if (!r.networkId) continue;
      const key = r.networkId;
      
      if (!networkBuckets[key]) {
        networkBuckets[key] = {
          networkId: r.networkId,
          networkName: r.networkName,
          supervisorName: r.supervisorName,
          supervisorPhone: r.supervisorPhone,
          dogsTotal: 0,
          valueTotal: 0,
          cells: {},
        };
      }
      
      networkBuckets[key].dogsTotal += r.totalDogs;
      networkBuckets[key].valueTotal += Number(r.totalValue);
      
      if (!networkBuckets[key].cells[r.cellName]) {
        networkBuckets[key].cells[r.cellName] = { name: r.cellName, totalDogs: 0 };
      }
      networkBuckets[key].cells[r.cellName].totalDogs += r.totalDogs;
    }

    // Convert cells record object para array pros templates usarem .map
    return Object.values(networkBuckets).map(n => ({
      ...n,
      cells: Object.values(n.cells).sort((a,b) => b.totalDogs - a.totalDogs)
    }));
  }

  /**
   * Dispara o consolidado de todos vendedores e células para o N8n (Ranking Global)
   */
  async triggerGlobalRankingReportToN8n(phone?: string) {
      const sellerReports = await this.getDailySalesReport();
      const cellReports = await this.getDailySalesReportByCell();
      
      const grandTotalDogs = sellerReports.reduce((acc, curr) => acc + curr.totalDogs, 0);
      const grandTotalValue = sellerReports.reduce((acc, curr) => acc + Number(curr.totalValue), 0);

      this.logger.log('Disparando Relatório de Ranking Global para N8N...');
      
      const message = MW_GlobalRankingReport(
        grandTotalDogs,
        cellReports.sort((a, b) => b.dogsTotal - a.dogsTotal),
        sellerReports.sort((a, b) => b.totalDogs - a.totalDogs).map(s => ({
          sellerName: s.sellerName,
          totalDogs: s.totalDogs,
        }))
      );

      try {
          // Busca cache global anterior para evitar reenvios idênticos caso seja mesma contagem
          const globalCache = await this.prisma.dailyReportSoldsCache.findFirst({
            where: { type: 'global', refId: 'GLOBAL_RANKING' }
          });

          if (!this.isChanged(globalCache, grandTotalDogs, grandTotalValue)) {
            this.logger.log('Nenhuma mudança no Ranking Global. Pulo do envio N8N evitado.');
            return { success: true, message: 'Sem alterações no ranking.' };
          }

          await this.n8nService.dispatchEvent('GLOBAL_RANKING_REPORT', {
              adminPhone: phone || '', // Destinatário (se houver, vazio envia no default group do N8N)
              message,
              summary: {
                  totalDogs: grandTotalDogs,
                  totalValue: grandTotalValue,
              },
              cellsRanking: cellReports.sort((a, b) => b.dogsTotal - a.dogsTotal),
              sellersRanking: sellerReports.sort((a, b) => b.totalDogs - a.totalDogs).map(s => ({
                  sellerName: s.sellerName,
                  totalDogs: s.totalDogs,
              })),
          });

          // Atualiza cache!
          await this.saveCache(
              'global',
              'GLOBAL_RANKING',
              'Todos',
              'Todas',
              'Rede do Pastor',
              grandTotalDogs,
              grandTotalValue,
              globalCache?.id
          );

          return { success: true, message: 'Relatório global enfileirado no N8N.' };

      } catch (error: any) {
          await this.errorNotificationService.notify({
              title: 'Falha no Ranking Global Diário N8N',
              message: `O backend tentou disparar o Webhook de Ranking mas o N8N retornou erro ou não respondeu: ${error.message}`,
              severity: 'high',
              context: { endpoint: 'GLOBAL_RANKING_REPORT' }
          });
          
          this.logger.error(`Não foi possível enviar ranking global: ${error.message}`);
          return { success: false, message: 'Falha na comunicação com o N8N. Erro reportado no Discord.' };
      }
  }

  /**
   * Executa todo dia às 9 da manhã no horário de Brasília (-03:00)
   * Verifica o cache, envia relatório aos que mudaram as vendas, e salva novo cache.
   */
  @Cron('0 9 * * *', { timeZone: 'America/Sao_Paulo' })
  async sendDailyReportsIfChanged() {
    this.logger.log('Iniciando rotina de verificação de Relatórios Diários.');
    const isDev = this.configs.get<string>('NODE_ENV') === 'development';

    let sellerReports: ISellerReport[] = [];
    try {
      sellerReports = await this.getDailySalesReport();
    } catch {
      this.logger.log('Sem edição ativa ou erro ao buscar dados. Abortando CRON.');
      return;
    }

    if (!sellerReports.length) {
      this.logger.log('Nenhuma venda encontrada na edição ativa.');
      return;
    }

    // 1) Enviar para os VENDEDORES individualmente (se mudou)
    const sellerIds = sellerReports.map((r) => r.sellerId);
    
    // Busca Caches dos vendedores
    const existingSellerCaches = await this.prisma.dailyReportSoldsCache.findMany({
      where: { type: 'seller', refId: { in: sellerIds } },
    });
    const sellerCacheMap = Object.fromEntries(existingSellerCaches.map((c) => [c.refId, c]));

    for (const r of sellerReports) {
      if (!r.sellerPhone) continue; // Ignora se vendedor não tem wpp

      const cache = sellerCacheMap[r.sellerId];
      if (isDev || this.isChanged(cache, r.totalDogs, Number(r.totalValue))) {
        this.logger.log(`Disparando relatório individual atualizado para Vendedor: ${r.sellerName}`);
        
        const message = MW_SellerDailyReport(r.sellerName, r.totalDogs);

        await this.n8nService.dispatchEvent('SELLER_DAILY_REPORT', {
          ...r,
          phone: r.sellerPhone,
          message,
        });
        
        await this.saveCache(
          'seller',
          r.sellerId,
          r.sellerName,
          r.cellName,
          'Sem Rede', // Pode ser alimentado se trouxermos o network futuramente
          r.totalDogs,
          Number(r.totalValue),
          cache?.id,
        );
      }
    }

    // 2) Enviar para as CÉLULAS individualmente (se mudou)
    const cellReports = await this.getDailySalesReportByCell();
    const cellIds = cellReports.map((c) => c.cellId).filter(Boolean);

    const existingCellCaches = await this.prisma.dailyReportSoldsCache.findMany({
      where: { type: 'cell', refId: { in: cellIds } },
    });
    const cellCacheMap = Object.fromEntries(existingCellCaches.map((c) => [c.refId, c]));

    for (const c of cellReports) {
      if (!c.leaderPhone || !c.cellId) continue; // Células sem líder ou identificação

      const cache = cellCacheMap[c.cellId];
      if (isDev || this.isChanged(cache, c.dogsTotal, Number(c.valueTotal))) {
        this.logger.log(`Disparando relatório atualizado para Líder de Célula: ${c.leaderName} (${c.cellName})`);
        
        const message = MW_CellDailyReport(
          c.leaderName,
          c.cellName,
          c.dogsTotal,
          c.sellers.map(s => ({ name: s.name, totalDogs: s.totalDogs }))
        );

        await this.n8nService.dispatchEvent('CELL_DAILY_REPORT', {
          ...c,
          phone: c.leaderPhone,
          message,
        });

        await this.saveCache(
          'cell',
          c.cellId,
          '',
          c.cellName,
          'Sem Rede',
          c.dogsTotal,
          Number(c.valueTotal),
          cache?.id,
        );
      }
    }

    // 3) Enviar para os SUPERVISORES DE REDE (se mudou)
    const networkReports = await this.getDailySalesReportByNetwork();
    const networkIds = networkReports.map((n) => n.networkId);

    const existingNetworkCaches = await this.prisma.dailyReportSoldsCache.findMany({
      where: { type: 'network', refId: { in: networkIds } },
    });
    const networkCacheMap = Object.fromEntries(existingNetworkCaches.map((c) => [c.refId, c]));

    for (const n of networkReports) {
      if (!n.supervisorPhone) continue; // Redes sem supervisor

      const cache = networkCacheMap[n.networkId];
      if (isDev || this.isChanged(cache, n.dogsTotal, Number(n.valueTotal))) {
        this.logger.log(`Disparando relatório atualizado para Supervisor(a): ${n.supervisorName} (${n.networkName})`);
        
        const message = MW_NetworkDailyReport(
          n.supervisorName,
          n.networkName,
          n.dogsTotal,
          n.cells
        );

        await this.n8nService.dispatchEvent('NETWORK_DAILY_REPORT', {
          ...n,
          phone: n.supervisorPhone,
          message,
        });

        await this.saveCache(
          'network',
          n.networkId,
          '',
          '',
          n.networkName,
          n.dogsTotal,
          Number(n.valueTotal),
          cache?.id,
        );
      }
    }

    this.logger.log('CRON de relatórios diários (Sellers, Cells, Networks) finalizada com sucesso.');
  }

  /**
   * O sistema antigo enviava um Whatsapp "Meu Relatório" por Vendedor ao pesquisar pela TAG
   */
  async getSalesBySellerTag(sellerTag: string) {
    const activeEdition = await getActiveEdition(this.prisma);

    const orders = await this.prisma.order.findMany({
      where: {
        editionId: activeEdition?.id,
        sellerTag,
        paymentStatus: PaymentStatusEnum.PAID,
        active: true,
      },
      include: {
        customer: true,
        items: true,
        seller: true,
      },
    });

    if (!orders.length) {
      return {
        sellerName: `Nenhuma venda confirmada encontrada para a tag: ${sellerTag}`,
        sales: [],
        totalDogs: 0,
      };
    }

    const sellerName = orders[0].seller?.name ?? 'Vendedor na base';
    
    // Agrupa quantos dogs foram comprados por cada cliente
    const customerMap: Record<string, { customerName: string; quantity: number }> = {};
    for (const order of orders) {
      const customerName = order.customerName ?? 'Cliente Avulso';
      const quantity = order.items?.length ?? 0;

      if (!customerMap[customerName]) {
        customerMap[customerName] = { customerName, quantity };
      } else {
        customerMap[customerName].quantity += quantity;
      }
    }

    const sales = Object.values(customerMap).sort((a, b) => b.quantity - a.quantity);
    const totalDogs = sales.reduce((acc, s) => acc + s.quantity, 0);

    return {
      sellerName,
      sales,
      totalDogs,
    };
  }
}
