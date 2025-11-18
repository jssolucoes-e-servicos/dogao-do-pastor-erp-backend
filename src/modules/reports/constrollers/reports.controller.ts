// src/modules/reports/controllers/reports.controller.ts
import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { OrderReportService } from '../services/order-report.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly orderReportService: OrderReportService) {
    /* void */
  }

  /* 
  @Get('test')
async test(){
  return await 
} */

  @Get('orders-command/:id/pdf')
  async generateOrderPDFHtml(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.orderReportService.generateOrderPDFHtml(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=order_${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Get('orders-command/:id/preview')
  async previewHtmlOrderIndividual(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const html =
      await this.orderReportService.generateHtmlPreviewOrderIndividual(id);
    res.set({ 'Content-Type': 'text/html' });
    res.send(html);
  }

  @Get('orders-sheet/pdf')
  async generateAllOrdersSheetPDF(@Res() res: Response) {
    const pdfBuffer =
      await this.orderReportService.generateAllOrdersSinglePDF();
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=orders_sheet.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
}
