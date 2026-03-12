import { Controller, Get, Param, Post, Body, Res, UseGuards } from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import { OrdersReportService } from '../services/orders-report.service';
import { RankingReportService } from '../services/ranking-report.service';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly orderReportService: OrdersReportService,
    private readonly rankingReportService: RankingReportService
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
  async testDailyCron() {
    await this.rankingReportService.sendDailyReportsIfChanged();
    return { success: true, message: 'CRON sendDailyReportsIfChanged executada.' };
  }

  @Get('sales-by-tag/:tag')
  async getSalesBySellerTag(@Param('tag') tag: string) {
    return this.rankingReportService.getSalesBySellerTag(tag);
  }
}
