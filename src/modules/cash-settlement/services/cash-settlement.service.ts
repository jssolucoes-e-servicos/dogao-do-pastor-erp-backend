import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/helpers/importer.helper';
import { getActiveEdition } from 'src/common/helpers/edition-helper';

@Injectable()
export class CashSettlementService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Chamado automaticamente quando uma venda em dinheiro é finalizada no app.
   * Adiciona o valor ao acerto pendente do contributor na edição ativa.
   */
  async addCashOrder(orderId: string, contributorId: string, amount: number, editionId: string) {
    // Busca ou cria o acerto pendente do contributor nesta edição
    let settlement = await this.prisma.cashSettlement.findFirst({
      where: { contributorId, editionId, status: 'PENDING', active: true },
    });

    if (!settlement) {
      settlement = await this.prisma.cashSettlement.create({
        data: { contributorId, editionId, totalAmount: 0 },
      });
    }

    // Vincula a order ao acerto (se ainda não estiver)
    const existing = await this.prisma.cashSettlementOrder.findUnique({ where: { orderId } });
    if (!existing) {
      await this.prisma.cashSettlementOrder.create({
        data: { settlementId: settlement.id, orderId, amount },
      });
      await this.prisma.cashSettlement.update({
        where: { id: settlement.id },
        data: { totalAmount: { increment: amount } },
      });
    }

    return settlement;
  }

  /** Saldo pendente do contributor logado */
  async getMyBalance(contributorId: string) {
    const edition = await getActiveEdition(this.prisma);
    const settlements = await this.prisma.cashSettlement.findMany({
      where: { contributorId, active: true },
      include: {
        orders: { include: { order: { select: { id: true, customerName: true, totalValue: true, createdAt: true } } } },
        edition: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return settlements;
  }

  /** Vendedor informa que repassou */
  async submit(settlementId: string, contributorId: string, dto: { paymentMethod: string; notes?: string }) {
    const settlement = await this.prisma.cashSettlement.findFirst({
      where: { id: settlementId, contributorId, status: 'PENDING' },
    });
    if (!settlement) throw new NotFoundException('Acerto não encontrado');

    return this.prisma.cashSettlement.update({
      where: { id: settlementId },
      data: {
        status: 'SUBMITTED',
        paymentMethod: dto.paymentMethod,
        notes: dto.notes,
        submittedAt: new Date(),
      },
    });
  }

  /** Tesoureira confirma recebimento */
  async confirm(settlementId: string, confirmedById: string) {
    const settlement = await this.prisma.cashSettlement.findFirst({
      where: { id: settlementId, status: 'SUBMITTED' },
    });
    if (!settlement) throw new NotFoundException('Acerto não encontrado ou não submetido');

    return this.prisma.cashSettlement.update({
      where: { id: settlementId },
      data: { status: 'CONFIRMED', confirmedAt: new Date(), confirmedById },
    });
  }

  /** Lista todos os acertos (para financeiro/tesoureira) */
  async listAll(status?: string, editionId?: string) {
    const edition = editionId ? { id: editionId } : await getActiveEdition(this.prisma);
    return this.prisma.cashSettlement.findMany({
      where: {
        editionId: edition?.id,
        active: true,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        contributor: { select: { id: true, name: true, username: true } },
        edition: { select: { name: true, code: true } },
        orders: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Lista acertos da célula (para líderes) */
  async listByCell(cellId: string, editionId?: string) {
    const edition = editionId ? { id: editionId } : await getActiveEdition(this.prisma);
    // Busca contributors membros da célula
    const members = await this.prisma.contributorCell.findMany({
      where: { cellId, active: true },
      select: { contributorId: true },
    });
    const contributorIds = members.map((m) => m.contributorId);

    return this.prisma.cashSettlement.findMany({
      where: {
        contributorId: { in: contributorIds },
        editionId: edition?.id,
        active: true,
      },
      include: {
        contributor: { select: { id: true, name: true, username: true } },
        orders: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
