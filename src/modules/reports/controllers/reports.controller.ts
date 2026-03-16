import { Controller, Get, Param, Post, Body, Res, UseGuards } from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import { OrdersReportService } from '../services/orders-report.service';
import { RankingReportService } from '../services/ranking-report.service';
import { PaymentsTasksService } from 'src/modules/payments/services/payments-tasks.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(
    private readonly orderReportService: OrdersReportService,
    private readonly rankingReportService: RankingReportService,
    private readonly paymentsTasksService: PaymentsTasksService,
  ) {}

  @Get('orders-command/:id/preview')
  async previewHtmlOrderIndividual(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    // Retorna HTML puro da comanda para a página forçar a impressão térmica
    const html =
      await this.orderReportService.generateHtmlPreviewOrderIndividual(id);
    res.set({ 'Content-Type': 'text/html' });
    res.send(html);
  }

  @Get('orders-sheet/preview')
  async generateAllOrdersSheetPreview(@Res() res: Response) {
      const html = await this.orderReportService.generateAllOrdersHtmlPreview();
      res.set({ 'Content-Type': 'text/html' });
      res.send(html);
  }

  // --- PDF Endpoints ---

  @Get('orders-command/:id/pdf')
  async generateOrderPDFHtml(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.orderReportService.generateAllOrdersSinglePDF();
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=order_${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Get('orders-sheet/pdf')
  async generateAllOrdersSheetPDF(@Res() res: Response) {
    const pdfBuffer = await this.orderReportService.generateAllOrdersSheetPDF();
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=orders_sheet.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  // --- Endpoints para N8n e Rankings ---

  @Post('trigger-daily-ranking')
  async triggerGlobalRankingReportToN8n(@Body() body?: { adminPhone?: string }) {
    return this.rankingReportService.triggerGlobalRankingReportToN8n(body?.adminPhone);
  }

  @Post('test-daily-cron')
  @ApiOperation({ summary: 'Dispara manualmente a rotina de Relatórios Diários (Sandbox Mode intercepta)' })
  async testDailyCron() {
    await this.rankingReportService.sendDailyReportsIfChanged();
    return { success: true, message: 'CRON sendDailyReportsIfChanged executada.' };
  }

  @Post('audit-commands')
  @ApiOperation({ summary: 'Auditoria de comandas (FIX manual)' })
  async auditCommands() {
    return this.paymentsTasksService.auditMissingCommands();
  }

  @Post('audit-donations')
  @ApiOperation({ summary: 'Auditoria de doações (FIX manual)' })
  async auditDonations() {
    return this.paymentsTasksService.auditMissingDonations();
  }

  @Get('sales-by-tag/:tag')
  async getSalesBySellerTag(@Param('tag') tag: string) {
    return this.rankingReportService.getSalesBySellerTag(tag);
  }
}
