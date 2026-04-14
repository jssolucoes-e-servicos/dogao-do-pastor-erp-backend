import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/helpers/importer.helper';
import { getActiveEdition } from 'src/common/helpers/edition-helper';

@Injectable()
export class PurchasingService {
  constructor(private readonly prisma: PrismaService) {}

  async list(editionId?: string) {
    const edition = editionId ? { id: editionId } : await getActiveEdition(this.prisma);
    return this.prisma.purchaseOrder.findMany({
      where: { editionId: edition?.id, active: true, deletedAt: null },
      include: { items: { include: { product: true } }, edition: true },
      orderBy: { orderedAt: 'desc' },
    });
  }

  async findById(id: string) {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, edition: true },
    });
    if (!order) throw new NotFoundException('Pedido de compra não encontrado');
    return order;
  }

  async create(dto: {
    editionId?: string;
    supplierName?: string;
    notes?: string;
    orderedAt?: string;
    createdById?: string;
    items: { productId: string; quantity: number; unitPrice: number }[];
  }) {
    let editionId = dto.editionId;
    if (!editionId) {
      const edition = await getActiveEdition(this.prisma);
      if (!edition) throw new NotFoundException('Nenhuma edição ativa');
      editionId = edition.id;
    }

    const totalValue = dto.items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);

    const order = await this.prisma.purchaseOrder.create({
      data: {
        editionId,
        supplierName: dto.supplierName,
        notes: dto.notes,
        orderedAt: dto.orderedAt ? new Date(dto.orderedAt) : new Date(),
        createdById: dto.createdById,
        totalValue,
        items: {
          create: dto.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.quantity * i.unitPrice,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });

    // Gera movimentação de entrada no estoque automaticamente
    for (const item of dto.items) {
      await this.prisma.stockMovement.create({
        data: {
          productId: item.productId,
          editionId,
          type: 'PURCHASE_IN',
          quantity: item.quantity,
          notes: `Compra: ${dto.supplierName || 'sem fornecedor'}`,
          createdById: dto.createdById,
        } as any,
      });
    }

    return order;
  }

  async markDelivered(id: string) {
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { deliveredAt: new Date() },
    });
  }

  // Relatório de consumo por produto por edição (para análise estratégica)
  async consumptionReport(editionId?: string) {
    const edition = editionId ? { id: editionId } : await getActiveEdition(this.prisma);
    if (!edition) return [];

    const [purchases, movements] = await Promise.all([
      this.prisma.purchaseItem.findMany({
        where: { purchaseOrder: { editionId: edition.id, active: true } },
        include: { product: true },
      }),
      this.prisma.stockMovement.findMany({
        where: { editionId: edition.id, active: true },
        include: { product: true },
      }),
    ]);

    const report: Record<string, any> = {};

    for (const p of purchases) {
      const pid = p.productId;
      if (!report[pid]) report[pid] = { product: p.product, purchased: 0, used: 0, surplus: 0, totalCost: 0 };
      report[pid].purchased += p.quantity;
      report[pid].totalCost += p.totalPrice;
    }

    for (const m of movements) {
      const pid = m.productId;
      if (!report[pid]) report[pid] = { product: m.product, purchased: 0, used: 0, surplus: 0, totalCost: 0 };
      if (m.type === 'PRODUCTION_OUT') report[pid].used += m.quantity;
    }

    for (const r of Object.values(report)) {
      r.surplus = r.purchased - r.used;
    }

    return Object.values(report).sort((a: any, b: any) => a.product.name.localeCompare(b.product.name));
  }
}
