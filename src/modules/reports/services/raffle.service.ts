import { Injectable } from '@nestjs/common';
import {
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { BaseService } from 'src/common/services/base.service';
import { PaymentStatusEnum, OrderOriginEnum } from 'src/common/enums';

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

  /** Retorna TODOS os vendedores ativos com seus dogs vendidos na edição (exceto tags internas) */
  async getSellerRaffleEntries(
    editionId: string,
  ): Promise<SellerRaffleEntry[]> {
    const EXCLUDED_TAGS = ['dogao', 'prfabiano'];

    // 1. Busca todos os vendedores ativos (exceto tags internas)
    const allSellers = await this.prisma.seller.findMany({
      where: {
        active: true,
        tag: { notIn: EXCLUDED_TAGS },
      },
      select: { id: true, name: true, tag: true },
      orderBy: { name: 'asc' },
    });

    if (allSellers.length === 0) return [];

    // 2. Busca pedidos pagos da edição, excluindo PDV
    const orders = await this.prisma.order.findMany({
      where: {
        editionId,
        paymentStatus: PaymentStatusEnum.PAID,
        active: true,
        origin: { not: OrderOriginEnum.PDV },
        sellerId: { in: allSellers.map((s) => s.id) },
      },
      select: { id: true, sellerId: true },
    });

    // 3. Conta items por pedido
    const itemCounts = await this.prisma.orderItem.groupBy({
      by: ['orderId'],
      _count: { id: true },
      where: { orderId: { in: orders.map((o) => o.id) }, active: true },
    });

    const itemsPerOrder: Record<string, number> = Object.fromEntries(
      itemCounts.map((g) => [g.orderId, g._count.id]),
    );

    // 4. Soma dogs por vendedor
    const dogsPerSeller: Record<string, number> = {};
    for (const o of orders) {
      dogsPerSeller[o.sellerId!] =
        (dogsPerSeller[o.sellerId!] || 0) + (itemsPerOrder[o.id] || 0);
    }

    // 5. Monta resultado com TODOS os vendedores (0 dogs se não vendeu nada)
    return allSellers
      .map((s) => {
        const totalDogs = dogsPerSeller[s.id] || 0;
        return {
          sellerId: s.id,
          sellerName: s.name,
          sellerTag: s.tag,
          totalDogs,
          tickets: Math.floor(totalDogs / 25),
        };
      })
      .sort((a, b) => b.totalDogs - a.totalDogs);
  }
}
