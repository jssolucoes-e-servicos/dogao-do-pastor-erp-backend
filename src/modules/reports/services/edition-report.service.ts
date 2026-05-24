import { Injectable, NotFoundException } from '@nestjs/common';
import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import {
  DeliveryOptionEnum,
  OrderOriginEnum,
  PaymentStatusEnum,
} from 'src/common/enums';

@Injectable()
export class EditionReportService extends BaseService {
  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
  ) {
    super(configService, loggerService, prismaService);
  }

  async getEditionSummary(editionId: string) {
    const edition = await this.prisma.edition.findUnique({
      where: { id: editionId },
    });
    if (!edition) throw new NotFoundException('Edição não encontrada');

    const orders = await this.prisma.order.findMany({
      where: {
        editionId,
        paymentStatus: PaymentStatusEnum.PAID,
        totalValue: { gt: 0 },
        active: true,
      },
      include: {
        items: { select: { id: true } },
        seller: { select: { tag: true, name: true } },
      },
    });

    // Totais por origem
    const site = orders.filter((o) => o.origin === OrderOriginEnum.SITE || o.origin === OrderOriginEnum.APP);
    const pdv = orders.filter((o) => o.origin === OrderOriginEnum.PDV);

    const dogsSite = site.reduce((acc, o) => acc + o.items.length, 0);
    const dogsPdv = pdv.reduce((acc, o) => acc + o.items.length, 0);
    const dogsTotal = dogsSite + dogsPdv;

    const revenueSite = site.reduce((acc, o) => acc + o.totalValue, 0);
    const revenuePdv = pdv.reduce((acc, o) => acc + o.totalValue, 0);
    const revenueTotal = revenueSite + revenuePdv;

    // Totais por tipo de entrega
    const pickup = orders.filter((o) => o.deliveryOption === DeliveryOptionEnum.PICKUP);
    const delivery = orders.filter((o) => o.deliveryOption === DeliveryOptionEnum.DELIVERY);
    const donate = orders.filter((o) => o.deliveryOption === DeliveryOptionEnum.DONATE);

    const deliverySummary = {
      pickup: {
        orders: pickup.length,
        dogs: pickup.reduce((acc, o) => acc + o.items.length, 0),
      },
      delivery: {
        orders: delivery.length,
        dogs: delivery.reduce((acc, o) => acc + o.items.length, 0),
      },
      donate: {
        orders: donate.length,
        dogs: donate.reduce((acc, o) => acc + o.items.length, 0),
      },
    };

    // Ranking por tag de vendedor (apenas site)
    const tagMap = new Map<
      string,
      { tag: string; name: string; orders: number; dogs: number; revenue: number }
    >();

    for (const order of site) {
      const tag = order.sellerTag ?? order.seller?.tag ?? 'sem-tag';
      const name = order.seller?.name ?? tag;
      if (!tagMap.has(tag)) {
        tagMap.set(tag, { tag, name, orders: 0, dogs: 0, revenue: 0 });
      }
      const entry = tagMap.get(tag)!;
      entry.orders++;
      entry.dogs += order.items.length;
      entry.revenue += order.totalValue;
    }

    const rankingBySeller = Array.from(tagMap.values())
      .sort((a, b) => b.dogs - a.dogs)
      .map((s, i) => ({ position: i + 1, ...s }));

    return {
      edition: {
        id: edition.id,
        name: edition.name,
        code: edition.code,
        productionDate: edition.productionDate,
        dogPrice: edition.dogPrice,
        limitSale: edition.limitSale,
      },
      generatedAt: new Date().toISOString(),
      totals: {
        orders: orders.length,
        dogs: dogsTotal,
        revenue: revenueTotal,
        byOrigin: {
          site: { orders: site.length, dogs: dogsSite, revenue: revenueSite },
          pdv: { orders: pdv.length, dogs: dogsPdv, revenue: revenuePdv },
        },
      },
      deliverySummary,
      rankingBySeller,
    };
  }

  async getEditionCellsReport(editionId: string) {
    const edition = await this.prisma.edition.findUnique({
      where: { id: editionId },
    });
    if (!edition) throw new NotFoundException('Edição não encontrada');

    const orders = await this.prisma.order.findMany({
      where: {
        editionId,
        paymentStatus: PaymentStatusEnum.PAID,
        active: true,
      },
      include: {
        items: {
          where: { active: true },
          select: { id: true },
        },
        seller: {
          select: {
            tag: true,
            name: true,
            cell: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const EXCLUDED_TAGS = ['dogao', 'prfabiano'];

    const sellerMap = new Map<
      string,
      { tag: string; name: string; cellName: string; dogs: number }
    >();

    const cellMap = new Map<
      string,
      { cellId: string; cellName: string; dogs: number }
    >();

    for (const order of orders) {
      const tag = order.sellerTag ?? order.seller?.tag ?? 'sem-tag';
      if (EXCLUDED_TAGS.includes(tag)) continue;

      const name = order.seller?.name ?? tag;
      const cellId = order.seller?.cell?.id ?? 'sem-celula';
      const cellName = order.seller?.cell?.name ?? 'Sem Célula';
      const dogsCount = order.items.length;

      // Bloco 1: Por Tag (Vendedor)
      if (!sellerMap.has(tag)) {
        sellerMap.set(tag, { tag, name, cellName, dogs: 0 });
      }
      sellerMap.get(tag)!.dogs += dogsCount;

      // Bloco 2: Por Célula (Agrupado)
      if (!cellMap.has(cellId)) {
        cellMap.set(cellId, { cellId, cellName, dogs: 0 });
      }
      cellMap.get(cellId)!.dogs += dogsCount;
    }

    const tagsReport = Array.from(sellerMap.values())
      .sort((a, b) => b.dogs - a.dogs);

    const cellsReport = Array.from(cellMap.values())
      .sort((a, b) => b.dogs - a.dogs);

    return {
      edition: {
        id: edition.id,
        name: edition.name,
        productionDate: edition.productionDate,
      },
      generatedAt: new Date().toISOString(),
      tags: tagsReport,
      cells: cellsReport,
    };
  }
}
