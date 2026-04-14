import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/helpers/importer.helper';
import { getActiveEdition } from 'src/common/helpers/edition-helper';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Produtos ──────────────────────────────────────────────────────────

  async listProducts() {
    return this.prisma.stockProduct.findMany({
      where: { active: true, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async createProduct(dto: { name: string; unit: string; description?: string }) {
    return this.prisma.stockProduct.create({ data: dto });
  }

  async updateProduct(id: string, dto: { name?: string; unit?: string; description?: string }) {
    return this.prisma.stockProduct.update({ where: { id }, data: dto });
  }

  // ── Movimentações ─────────────────────────────────────────────────────

  async listMovements(editionId?: string) {
    const edition = editionId ? { id: editionId } : await getActiveEdition(this.prisma);
    return this.prisma.stockMovement.findMany({
      where: { editionId: edition?.id, active: true, deletedAt: null },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addMovement(dto: {
    productId: string;
    editionId?: string;
    type: string;
    quantity: number;
    notes?: string;
    createdById?: string;
  }) {
    let editionId = dto.editionId;
    if (!editionId) {
      const edition = await getActiveEdition(this.prisma);
      if (!edition) throw new NotFoundException('Nenhuma edição ativa');
      editionId = edition.id;
    }
    return this.prisma.stockMovement.create({
      data: { ...dto, editionId } as any,
      include: { product: true },
    });
  }

  // ── Saldo por edição ──────────────────────────────────────────────────

  async getBalance(editionId?: string) {
    const edition = editionId ? { id: editionId } : await getActiveEdition(this.prisma);
    if (!edition) return [];

    const movements = await this.prisma.stockMovement.findMany({
      where: { editionId: edition.id, active: true },
      include: { product: true },
    });

    const balance: Record<string, { product: any; in: number; out: number; balance: number }> = {};

    for (const m of movements) {
      const pid = m.productId;
      if (!balance[pid]) balance[pid] = { product: m.product, in: 0, out: 0, balance: 0 };
      if (m.type === 'PURCHASE_IN') {
        balance[pid].in += m.quantity;
      } else {
        balance[pid].out += m.quantity;
      }
      balance[pid].balance = balance[pid].in - balance[pid].out;
    }

    return Object.values(balance).sort((a, b) => a.product.name.localeCompare(b.product.name));
  }
}
