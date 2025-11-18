// src/modules/reports/services/order-report.service.ts
import {
  ConfigService,
  LoggerService,
  PrismaService,
} from '@/common/helpers/importer-helper';
import { BaseService } from '@/common/services/base.service';
import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import * as XLSX from 'xlsx';

@Injectable()
export class ExportsService extends BaseService {
  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    configService: ConfigService,
  ) {
    super(loggerService, prismaService, configService);
  }

  async exportOrdersExcel(res: Response) {
    const orders = await this.prisma.orderOnline.findMany({
      include: {
        customer: { include: { addresses: true } },
        seller: { include: { cell: true } },
        preOrderItems: true,
        edition: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    function buildSheetData(list, deliveryOption) {
      return list
        .filter((order) => order.deliveryOption === deliveryOption)
        .map((order) => {
          const grouped: { [key: string]: number } = {};
          for (const item of order.preOrderItems ?? []) {
            const key =
              item.removedIngredients && item.removedIngredients.length > 0
                ? `NO ${item.removedIngredients.join(', ')}`
                : 'Dogão Completo';
            grouped[key] = (grouped[key] || 0) + 1;
          }
          const itemsCell = Object.entries(grouped)
            .map(([name, qty]) => `${qty}x ${name}`)
            .join(' | ');

          const row: any = {
            ID: order.id,
            Customer: order.customer?.name ?? '',
            Phone: order.customer?.phone ?? '',
            Seller: order.seller?.name ?? '',
            CellGroup: order.seller?.cell?.name ?? '',
            Leader: order.seller?.cell?.leaderName ?? '',
            Scheduled: order.deliveryTime ?? '',
            Items: itemsCell,
            Notes: order.observations ?? '',
          };

          if (deliveryOption === 'delivery') {
            row.Address = `${order.customer?.addresses?.[0]?.street ?? ''}, ${order.customer?.addresses?.[0]?.number ?? ''}`;
            row.Reference = order.customer?.addresses?.[0]?.complement ?? '';
          }

          return row;
        });
    }

    const deliveries = buildSheetData(orders, 'delivery');
    const pickups = buildSheetData(orders, 'pickup');
    const donations = buildSheetData(orders, 'donate');

    const wb = XLSX.utils.book_new();
    if (deliveries.length)
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(deliveries),
        'Deliveries',
      );
    if (pickups.length)
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(pickups),
        'Pickups',
      );
    if (donations.length)
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(donations),
        'Donations',
      );

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="orders.xlsx"');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.end(buffer);
  }
}
