import { Body, Controller, Get, Logger, Param, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PaymentsTasksService } from 'src/modules/payments/services/payments-tasks.service';
import { OrdersReportService } from '../services/orders-report.service';
import { RankingReportService } from '../services/ranking-report.service';
import { EditionReportService } from '../services/edition-report.service';
import { RaffleService } from '../services/raffle.service';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(
    private readonly orderReportService: OrdersReportService,
    private readonly rankingReportService: RankingReportService,
    private readonly paymentsTasksService: PaymentsTasksService,
    private readonly editionReportService: EditionReportService,
    private readonly raffleService: RaffleService,
  ) { }

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


  @ApiQuery({
    name: 'format',
    required: false,
    description: 'Formato desejado',
    example: 'pdf'
  })
  @Get('failed-pending-orders/:editionId')
  async getFailedPendingOrdersReport(
    @Param('editionId') editionId: string,
    @Res() res: Response,
    @Query('format') formatParam?: string,
  ) {
    console.log('editionId', editionId);
    console.log('formatParam', formatParam);
    const format = (formatParam || 'json').toLowerCase();
    this.logger.log(`Solicitação de relatório: Edição=${editionId}, Formato=${format}`);

    if (format === 'json') {
      const data =
        await this.orderReportService.getFailedPendingOrdersData(editionId);
      return res.json(data);
    }

    if (format === 'pdf' || format === 'excel') {
      await this.orderReportService.dispatchReportToN8n(editionId, format);
      return res.json({
        message: `Relatório em formato ${format.toUpperCase()} solicitado. O processamento iniciou no n8n.`,
      });
    }

    return res.status(400).json({ message: 'Formato inválido. Use json, pdf ou excel.' });
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

  @Get('edition/:id/summary')
  @ApiOperation({ summary: 'Relatório completo de uma edição — totais, entrega, ranking por vendedor' })
  async getEditionSummary(@Param('id') id: string) {
    return this.editionReportService.getEditionSummary(id);
  }

  // --- Sorteio ---

  @Get('raffle/customers')
  @ApiOperation({ summary: 'Lista de clientes para sorteio (1 cupom por dog pago, já embaralhada)' })
  async getCustomerRaffle(@Query('editionId') editionId: string) {
    return this.raffleService.getCustomerRaffleEntries(editionId);
  }

  @Get('raffle/sellers')
  @ApiOperation({ summary: 'Lista de vendedores para sorteio (1 cupom a cada 25 dogs)' })
  async getSellerRaffle(@Query('editionId') editionId: string) {
    return this.raffleService.getSellerRaffleEntries(editionId);
  }
}
