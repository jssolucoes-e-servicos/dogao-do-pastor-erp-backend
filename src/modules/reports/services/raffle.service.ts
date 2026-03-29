import { Injectable } from '@nestjs/common';
import {
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { BaseService } from 'src/common/services/base.service';
import { PaymentStatusEnum } from 'src/common/enums';
import { RankingReportService } from './ranking-report.service';

export interface CustomerRaffleEntry {
  customerId: string;
  customerName: string;
  tickets: number;
}

export interface SellerRaffleEntry {
  sellerId: string;
  sellerName: string;
  sellerTag: string;
  totalDogs: number;
  tickets: number;
}

@Injectable()
export class RaffleService extends BaseService {
  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
    private readonly rankingService: RankingReportService,
  ) {
    super(configService, loggerService, prismaService);
  }

  /** Retorna lista de clientes com tickets (1 por dog pago) — já embaralhada */
  async getCustomerRaffleEntries(
    editionId: string,
  ): Promise<CustomerRaffleEntry[]> {
    const rows = await this.prisma.orderItem.findMany({
      where: {
        order: {
          editionId,
          paymentStatus: PaymentStatusEnum.PAID,
          active: true,
        },
        active: true,
      },
      select: {
        order: { select: { customerId: true, customerName: true } },
      },
    });

    const map: Record<string, CustomerRaffleEntry> = {};
    for (const row of rows) {
      const id = row.order.customerId;
      const name = row.order.customerName;
      if (!map[id]) {
        map[id] = { customerId: id, customerName: name, tickets: 0 };
      }
      map[id].tickets++;
    }

    const entries = Object.values(map);
    for (let i = entries.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [entries[i], entries[j]] = [entries[j], entries[i]];
    }

    return entries;
  }

  /** Retorna lista de vendedores com dogs vendidos (1 cupom a cada 25 dogs) */
  async getSellerRaffleEntries(
    editionId: string,
  ): Promise<SellerRaffleEntry[]> {
    const sellerReports =
      await this.rankingService.getDailySalesReport(editionId);

    return sellerReports
      .filter((s) => s.totalDogs > 0)
      .map((s) => ({
        sellerId: s.sellerId,
        sellerName: s.sellerName,
        sellerTag: s.sellerTag,
        totalDogs: s.totalDogs,
        tickets: Math.floor(s.totalDogs / 25),
      }))
      .sort((a, b) => b.totalDogs - a.totalDogs);
  }
}
