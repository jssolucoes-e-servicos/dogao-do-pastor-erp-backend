import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from '@/common/helpers/importer-helper';
import { Injectable } from '@nestjs/common';
import { EDITION_ID } from 'src/common/constants/ids';

export interface IDashboardStats {
  counters: {
    vouchers: number;
    availableVouchers: number;
    customers: number;
    orders: number;
    sellers: number;
    usedVouchers: number;
    saleDogs: number;
    availableDogs: number;
  };
}

// Interface para o resultado da agregação
interface VoucherStatsResult {
  _id: null;
  totalVouchers: number;
  usedVouchers: number;
}

@Injectable()
export class DashboardService extends BaseService {
  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    configService: ConfigService,
  ) {
    super(loggerService, prismaService, configService);
  }

  async getStats(): Promise<IDashboardStats> {
    const [voucherResults, ...otherCounts] = await this.prisma.$transaction([
      this.prisma.voucher.aggregateRaw({
        pipeline: [
          {
            $match: {
              editionId: EDITION_ID,
            },
          },
          {
            $group: {
              _id: null,
              totalVouchers: { $sum: 1 },
              usedVouchers: {
                $sum: {
                  $cond: { if: '$used', then: 1, else: 0 },
                },
              },
            },
          },
        ],
      }),
      this.prisma.customer.count(),
      this.prisma.seller.count(),
      this.prisma.order.count(),
      this.prisma.orderOnline.count({
        where: { paymentStatus: 'paid' },
      }),
      this.prisma.orderItem.count(),
      this.prisma.orderOnlineItem.count({
        where: { orderOnline: { paymentStatus: 'paid' } },
      }),
    ]);

    // Usar a asserção de tipo `as unknown as Type[]` para resolver o problema de tipagem
    const [stats] = voucherResults as unknown as VoucherStatsResult[];

    if (!stats) {
      // Caso não haja vouchers, tratar o cenário para evitar erros
      const [customers, sellers, orders, ordersOnline, items, itemsOnline] =
        otherCounts;

      const totalOrders = orders + ordersOnline;
      const saleDogs = items + itemsOnline;

      return {
        counters: {
          vouchers: 0,
          usedVouchers: 0,
          availableVouchers: 0,
          customers: customers,
          orders: totalOrders,
          sellers: sellers,
          saleDogs: saleDogs,
          availableDogs: 1000 - saleDogs,
        },
      };
    }

    const { totalVouchers, usedVouchers } = stats;

    const [customers, sellers, orders, ordersOnline, items, itemsOnline] =
      otherCounts;

    const totalOrders = orders + ordersOnline;
    const saleDogs = items + itemsOnline;

    const result = {
      counters: {
        vouchers: totalVouchers,
        usedVouchers: usedVouchers,
        availableVouchers: totalVouchers - usedVouchers,
        customers: customers,
        orders: totalOrders,
        sellers: sellers,
        saleDogs: saleDogs,
        availableDogs: 1000 - saleDogs,
      },
    };

    return result;
  }
}
