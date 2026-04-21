import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/helpers/importer.helper';
import { getActiveEdition } from 'src/common/helpers/edition-helper';
import { MpPaymentsService } from 'src/modules/payments/services/mercadopago/mp-payments.service';
import { UploadsService } from 'src/modules/uploads/services/uploads.service';
import { MemoryStoredFile } from 'nestjs-form-data';

@Injectable()
export class CashSettlementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mpPayments: MpPaymentsService,
    private readonly uploads: UploadsService,
  ) {}

  // ── Helpers ───────────────────────────────────────────────────────────

  /** Retorna ou cria o settlement PENDING de um contributor na edição */
  private async getOrCreateSettlement(contributorId: string, editionId: string) {
    let settlement = await this.prisma.cashSettlement.findFirst({
      where: { contributorId, editionId, active: true },
    });
    if (!settlement) {
      settlement = await this.prisma.cashSettlement.create({
        data: { contributorId, editionId, totalAmount: 0, paidAmount: 0 },
      });
    }
    return settlement;
  }

  /** Recalcula paidAmount a partir dos pagamentos confirmados */
  private async recalcPaidAmount(settlementId: string) {
    const confirmed = await this.prisma.cashSettlementPayment.findMany({
      where: { settlementId, status: 'CONFIRMED', deletedAt: null },
    });
    const paidAmount = confirmed.reduce((s, p) => s + p.amount, 0);

    const settlement = await this.prisma.cashSettlement.findUnique({
      where: { id: settlementId },
    });
    if (!settlement) return;

    const balance = settlement.totalAmount - paidAmount;
    const newStatus = balance <= 0.001 ? 'CONFIRMED' : 'PENDING';

    await this.prisma.cashSettlement.update({
      where: { id: settlementId },
      data: { paidAmount, status: newStatus as any },
    });
  }

  // ── Adicionar venda em dinheiro ao saldo ──────────────────────────────

  async addCashOrder(orderId: string, contributorId: string, amount: number, editionId: string) {
    const settlement = await this.getOrCreateSettlement(contributorId, editionId);

    const existing = await this.prisma.cashSettlementOrder.findUnique({ where: { orderId } });
    if (!existing) {
      await this.prisma.cashSettlementOrder.create({
        data: { settlementId: settlement.id, orderId, amount },
      });
      await this.prisma.cashSettlement.update({
        where: { id: settlement.id },
        data: { totalAmount: { increment: amount }, status: 'PENDING' as any },
      });
    } else if (Math.abs(existing.amount - amount) > 0.001) {
      const diff = amount - existing.amount;
      await this.prisma.cashSettlementOrder.update({
        where: { orderId },
        data: { amount },
      });
      await this.prisma.cashSettlement.update({
        where: { id: settlement.id },
        data: { totalAmount: { increment: diff } },
      });
    }

    return this.prisma.cashSettlement.findUnique({ where: { id: settlement.id } });
  }

  // ── Meu saldo (vendedor) ──────────────────────────────────────────────

  async getMyBalance(contributorId: string) {
    const settlements = await this.prisma.cashSettlement.findMany({
      where: { contributorId, active: true },
      include: {
        orders: {
          include: {
            order: { select: { id: true, customerName: true, totalValue: true, createdAt: true, paymentType: true } },
          },
        },
        payments: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
        edition: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Recalcula paidAmount para garantir consistência
    for (const s of settlements) {
      const correctPaid = s.payments
        .filter(p => p.status === 'CONFIRMED')
        .reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(s.paidAmount - correctPaid) > 0.001) {
        await this.prisma.cashSettlement.update({
          where: { id: s.id },
          data: { paidAmount: correctPaid },
        });
        s.paidAmount = correctPaid;
      }
    }

    return settlements;
  }

  // ── Opção 1: PIX QR Code via MP ───────────────────────────────────────

  async generatePixQrCode(settlementId: string, contributorId: string, amount: number) {
    const settlement = await this.prisma.cashSettlement.findFirst({
      where: { id: settlementId, contributorId, status: 'PENDING' },
      include: { contributor: true },
    });
    if (!settlement) throw new NotFoundException('Acerto não encontrado');

    const balance = settlement.totalAmount - settlement.paidAmount;
    if (amount > balance + 0.001) {
      throw new BadRequestException(`Valor R$${amount} maior que o saldo devedor R$${balance.toFixed(2)}`);
    }

    const pixResponse = await this.mpPayments.processPixPayment(
      { name: settlement.contributor.name, phone: settlement.contributor.phone || '', email: null },
      `acerto-${settlementId}-${Date.now()}`,
      amount,
    );

    if (!pixResponse.success || !pixResponse.payment) {
      throw new BadRequestException('Erro ao gerar PIX');
    }

    // Cria o registro de pagamento
    const payment = await this.prisma.cashSettlementPayment.create({
      data: {
        settlementId,
        amount,
        paymentMethod: 'PIX_QRCODE',
        status: 'SUBMITTED',
        mpPaymentId: pixResponse.payment.id,
        pixQrCode: pixResponse.payment.pix?.qrCodeBase64 ?? null,
        pixCopyPaste: pixResponse.payment.pix?.qrCode ?? null,
      },
    });

    return {
      paymentId: payment.id,
      mpPaymentId: pixResponse.payment.id,
      qrCodeBase64: pixResponse.payment.pix?.qrCodeBase64,
      pixCopyPaste: pixResponse.payment.pix?.qrCode,
      amount,
    };
  }

  // ── Callback MP: PIX QR Code pago ────────────────────────────────────

  async handleMpPayment(mpPaymentId: string, status: string): Promise<boolean> {
    if (status !== 'approved') return false;

    const payment = await this.prisma.cashSettlementPayment.findFirst({
      where: { mpPaymentId, deletedAt: null },
    });
    if (!payment) return false;

    await this.prisma.cashSettlementPayment.update({
      where: { id: payment.id },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
    });

    await this.recalcPaidAmount(payment.settlementId);
    return true;
  }

  // ── Opção 2: PIX IVC (manual) ─────────────────────────────────────────

  async submitPixIvc(
    settlementId: string,
    contributorId: string,
    dto: { amount: number; receiptDate: string; receipt?: MemoryStoredFile },
  ) {
    const settlement = await this.prisma.cashSettlement.findFirst({
      where: { id: settlementId, contributorId, status: 'PENDING' },
    });
    if (!settlement) throw new NotFoundException('Acerto não encontrado');

    const balance = settlement.totalAmount - settlement.paidAmount;
    if (dto.amount > balance + 0.001) {
      throw new BadRequestException(`Valor maior que o saldo devedor R$${balance.toFixed(2)}`);
    }

    let receiptUrl: string | undefined;
    if (dto.receipt) {
      const [uploaded] = await this.uploads.uploadFiles([dto.receipt], 'settlements', settlementId);
      receiptUrl = uploaded.url;
    }

    return this.prisma.cashSettlementPayment.create({
      data: {
        settlementId,
        amount: dto.amount,
        paymentMethod: 'PIX_IVC',
        status: 'SUBMITTED',
        receiptUrl,
        receiptDate: new Date(dto.receiptDate),
      },
    });
  }

  // ── Opção 3: Tesouraria (espécie) ─────────────────────────────────────

  async submitCash(settlementId: string, contributorId: string, amount: number) {
    const settlement = await this.prisma.cashSettlement.findFirst({
      where: { id: settlementId, contributorId, status: 'PENDING' },
    });
    if (!settlement) throw new NotFoundException('Acerto não encontrado');

    const balance = settlement.totalAmount - settlement.paidAmount;
    if (amount > balance + 0.001) {
      throw new BadRequestException(`Valor maior que o saldo devedor R$${balance.toFixed(2)}`);
    }

    return this.prisma.cashSettlementPayment.create({
      data: {
        settlementId,
        amount,
        paymentMethod: 'CASH',
        status: 'SUBMITTED',
      },
    });
  }

  // ── Tesoureira confirma um repasse ────────────────────────────────────

  async confirm(paymentId: string, confirmedById: string) {
    const payment = await this.prisma.cashSettlementPayment.findFirst({
      where: { id: paymentId, status: 'SUBMITTED', deletedAt: null },
    });
    if (!payment) throw new NotFoundException('Repasse não encontrado ou já confirmado');

    await this.prisma.cashSettlementPayment.update({
      where: { id: paymentId },
      data: { status: 'CONFIRMED', confirmedAt: new Date(), confirmedById },
    });

    await this.recalcPaidAmount(payment.settlementId);

    const settlement = await this.prisma.cashSettlement.findUnique({
      where: { id: payment.settlementId },
    });

    return {
      confirmed: true,
      paidAmount: settlement?.paidAmount ?? 0,
      totalAmount: settlement?.totalAmount ?? 0,
      remaining: (settlement?.totalAmount ?? 0) - (settlement?.paidAmount ?? 0),
    };
  }

  // ── Tesoureira registra acerto direto ─────────────────────────────────

  async registerDirect(dto: {
    contributorId: string;
    editionId?: string;
    amount: number;
    paymentMethod: string;
    notes?: string;
    registeredById: string;
  }) {
    let editionId = dto.editionId;
    if (!editionId) {
      const edition = await getActiveEdition(this.prisma);
      if (!edition) throw new NotFoundException('Nenhuma edição ativa');
      editionId = edition.id;
    }

    const settlement = await this.getOrCreateSettlement(dto.contributorId, editionId);

    const balance = settlement.totalAmount - settlement.paidAmount;
    if (dto.amount > balance + 0.001) {
      throw new BadRequestException(`Valor R$${dto.amount} maior que o saldo devedor R$${balance.toFixed(2)}`);
    }

    // Cria o pagamento já confirmado
    await this.prisma.cashSettlementPayment.create({
      data: {
        settlementId: settlement.id,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        status: 'CONFIRMED',
        notes: dto.notes,
        confirmedAt: new Date(),
        confirmedById: dto.registeredById,
      },
    });

    await this.recalcPaidAmount(settlement.id);
    return { success: true };
  }

  // ── Lista todos (financeiro/tesoureira) ───────────────────────────────

  async listAll(status?: string, editionId?: string) {
    const edition = editionId ? { id: editionId } : await getActiveEdition(this.prisma);
    return this.prisma.cashSettlement.findMany({
      where: {
        editionId: edition?.id,
        active: true,
        ...(status === 'PENDING' ? { status: 'PENDING' as any } : {}),
        ...(status === 'CONFIRMED' ? { status: 'CONFIRMED' as any } : {}),
      },
      include: {
        contributor: { select: { id: true, name: true, username: true, phone: true } },
        edition: { select: { name: true, code: true } },
        orders: true,
        payments: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Lista repasses aguardando confirmação (para Leticia) ──────────────

  async listPendingPayments(editionId?: string) {
    const edition = editionId ? { id: editionId } : await getActiveEdition(this.prisma);
    return this.prisma.cashSettlementPayment.findMany({
      where: {
        status: 'SUBMITTED',
        deletedAt: null,
        settlement: { editionId: edition?.id, active: true },
      },
      include: {
        settlement: {
          include: {
            contributor: { select: { id: true, name: true, username: true, phone: true } },
            edition: { select: { name: true, code: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ── Lista da célula (líder) ───────────────────────────────────────────

  async listByCell(cellId: string, editionId?: string) {
    const edition = editionId ? { id: editionId } : await getActiveEdition(this.prisma);
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
        payments: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Sincronização retroativa ──────────────────────────────────────────

  async syncCashOrders(editionId?: string) {
    const edition = editionId ? { id: editionId } : await getActiveEdition(this.prisma);
    if (!edition) throw new NotFoundException('Nenhuma edição ativa');

    const unlinkedOrders = await this.prisma.order.findMany({
      where: {
        editionId: edition.id,
        paymentType: 'MONEY',
        paymentStatus: 'PAID',
        active: true,
        cashSettlementOrder: null,
      },
      include: { seller: { include: { contributor: true } } },
    });

    let synced = 0;
    for (const order of unlinkedOrders) {
      const contributorId = order.createdByContributorId ?? order.seller?.contributorId;
      if (!contributorId) continue;
      try {
        await this.addCashOrder(order.id, contributorId, order.totalValue, edition.id);
        synced++;
      } catch { /* ignora duplicatas */ }
    }

    // Recalcula paidAmount de todos os settlements
    const settlements = await this.prisma.cashSettlement.findMany({
      where: { editionId: edition.id, active: true },
    });
    let recalculated = 0;
    for (const s of settlements) {
      const before = s.paidAmount;
      await this.recalcPaidAmount(s.id);
      const after = (await this.prisma.cashSettlement.findUnique({ where: { id: s.id } }))?.paidAmount ?? 0;
      if (Math.abs(before - after) > 0.001) recalculated++;
    }

    return { synced, recalculated, total: unlinkedOrders.length };
  }

  // ── Resumo financeiro (tesoureira) ────────────────────────────────────

  async getFinancialSummary(editionId?: string) {
    const edition = editionId ? { id: editionId } : await getActiveEdition(this.prisma);
    const settlements = await this.prisma.cashSettlement.findMany({
      where: { editionId: edition?.id, active: true },
    });

    const totalDue      = settlements.reduce((a, s) => a + s.totalAmount, 0);
    const totalPaid     = settlements.reduce((a, s) => a + s.paidAmount, 0);
    const totalPending  = totalDue - totalPaid;

    // Repasses aguardando confirmação
    const pendingPayments = await this.prisma.cashSettlementPayment.findMany({
      where: {
        status: 'SUBMITTED',
        deletedAt: null,
        settlement: { editionId: edition?.id, active: true },
      },
    });
    const submitted = pendingPayments.reduce((a, p) => a + p.amount, 0);

    return {
      totalDue,
      totalPaid,
      pending: totalPending - submitted,
      submitted,
      confirmed: totalPaid,
    };
  }
}
