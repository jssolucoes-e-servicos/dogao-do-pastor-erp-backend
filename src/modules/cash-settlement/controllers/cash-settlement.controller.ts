import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { CashSettlementService } from '../services/cash-settlement.service';
import { FormDataRequest, MemoryStoredFile } from 'nestjs-form-data';

@Controller('cash-settlements')
@UseGuards(JwtAuthGuard)
export class CashSettlementController {
  constructor(private readonly service: CashSettlementService) {}

  // ── Vendedor ──────────────────────────────────────────────────────────

  /** Meu saldo (settlements com ordens e pagamentos) */
  @Get('me')
  getMyBalance(@User() user: any) {
    return this.service.getMyBalance(user.id);
  }

  /** Gerar PIX QR Code MP para repasse */
  @Post(':id/pix-qrcode')
  generatePixQrCode(
    @Param('id') id: string,
    @User() user: any,
    @Body() body: { amount: number },
  ) {
    return this.service.generatePixQrCode(id, user.id, body.amount);
  }

  /** Informar PIX IVC (com comprovante) */
  @Post(':id/submit-pix-ivc')
  @FormDataRequest()
  submitPixIvc(
    @Param('id') id: string,
    @User() user: any,
    @Body() body: { amount: string; receiptDate: string; receipt?: MemoryStoredFile },
  ) {
    return this.service.submitPixIvc(id, user.id, {
      amount: parseFloat(body.amount),
      receiptDate: body.receiptDate,
      receipt: body.receipt,
    });
  }

  /** Informar espécie (tesouraria) */
  @Post(':id/submit-cash')
  submitCash(
    @Param('id') id: string,
    @User() user: any,
    @Body() body: { amount: number },
  ) {
    return this.service.submitCash(id, user.id, body.amount);
  }

  // ── Líder de célula ───────────────────────────────────────────────────

  /** Acertos da célula */
  @Get('cell/:cellId')
  listByCell(@Param('cellId') cellId: string, @Query('editionId') editionId?: string) {
    return this.service.listByCell(cellId, editionId);
  }

  // ── Tesoureira / Financeiro ───────────────────────────────────────────

  /** Todos os settlements */
  @Get()
  listAll(@Query('status') status?: string, @Query('editionId') editionId?: string) {
    return this.service.listAll(status, editionId);
  }

  /** Repasses aguardando confirmação */
  @Get('pending-payments')
  listPendingPayments(@Query('editionId') editionId?: string) {
    return this.service.listPendingPayments(editionId);
  }

  /** Resumo financeiro */
  @Get('summary')
  getSummary(@Query('editionId') editionId?: string) {
    return this.service.getFinancialSummary(editionId);
  }

  /** Confirmar um repasse (paymentId, não settlementId) */
  @Patch('payments/:paymentId/confirm')
  confirm(@Param('paymentId') paymentId: string, @User() user: any) {
    return this.service.confirm(paymentId, user.id);
  }

  /** Registrar acerto direto (tesoureira) */
  @Post('register-direct')
  registerDirect(@Body() body: any, @User() user: any) {
    return this.service.registerDirect({ ...body, registeredById: user.id });
  }

  /** Sincronizar vendas retroativamente */
  @Post('sync')
  syncCashOrders(@Query('editionId') editionId?: string) {
    return this.service.syncCashOrders(editionId);
  }
}
