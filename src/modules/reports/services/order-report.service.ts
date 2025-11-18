// src/modules/reports/services/order-report.service.ts
import {
  ConfigService,
  LoggerService,
  PrismaService,
} from '@/common/helpers/importer-helper';
import { BaseService } from '@/common/services/base.service';
import { OrderOnlineService } from '@/modules/order-online/services/order-online.service';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as path from 'path';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import * as puppeteer from 'puppeteer';
import * as QRCode from 'qrcode';
import { LogoInB64 } from '../base64/logo';

@Injectable()
export class OrderReportService extends BaseService {
  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    configService: ConfigService,
    private readonly orderOnlineService: OrderOnlineService,
  ) {
    super(loggerService, prismaService, configService);
    (pdfMake as any).vfs = pdfFonts.vfs;
  }

  getTemplatePath(): string {
    const templatePath = path.resolve(
      process.cwd(),
      'src/modules/reports/templates/order-individual.hbs',
    );
    return templatePath;
  }

  async buildOrderTemplateData(order: any): Promise<any> {
    const url = `https://erp.dogao.igrejavivaemcelulas.com.br/app/comanda/${order.id}`;
    const qrCodeBase64 = await QRCode.toDataURL(url);

    // Agrupa itens
    let items: { qty: number; name: string }[] = [];
    if (order.preOrderItems && order.preOrderItems.length) {
      const grouped: { [key: string]: number } = {};
      for (const item of order.preOrderItems) {
        const name =
          (item.removedIngredients || []).length > 0
            ? `SEM ${item.removedIngredients.join(', ')}`
            : 'Dogão Completo';
        grouped[name] = (grouped[name] || 0) + 1;
      }
      items = Object.entries(grouped).map(([name, qty]) => ({ name, qty }));
    } else {
      items = [{ name: 'Dogão Completo', qty: 1 }];
    }

    return {
      logo: LogoInB64,
      scheduled: order.deliveryTime,
      customer: {
        name: order.customer?.name ?? '',
        phone: order.customer?.phone ?? '',
        address: `${order.customer?.addresses?.[0]?.street ?? ''}, ${order.customer?.addresses?.[0]?.number ?? ''}`,
        reference: order.customer?.addresses?.[0]?.complement ?? '',
      },
      seller: {
        name: order.seller?.name ?? '',
        phone: order.seller?.phone ?? '',
        cellGroup: order.seller?.cell?.name ?? '',
        leader: order.seller?.cell?.leaderName ?? '',
        cellPhone: order.seller?.cell?.phone ?? '',
      },
      items,
      notes: order.observations ?? '',
      id: order.id ?? '',
      link: url,
      qrCode: qrCodeBase64,
    };
  }

  async generateHtmlPreviewOrderIndividual(
    orderOnlineId: string,
  ): Promise<string> {
    const order =
      await this.orderOnlineService.findOrderByIdForReport(orderOnlineId);
    const templateData = await this.buildOrderTemplateData(order);
    const templatePath = this.getTemplatePath();
    const hbsRaw = fs.readFileSync(templatePath, 'utf8');
    const hbsTemplate = handlebars.compile(hbsRaw);
    return hbsTemplate(templateData);
  }

  async generateOrderPDFHtml(orderOnlineId: string): Promise<Buffer> {
    const html = await this.generateHtmlPreviewOrderIndividual(orderOnlineId);
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      width: '100mm',
      height: '140mm',
      printBackground: true,
      margin: { top: '3mm', right: '3mm', bottom: '3mm', left: '3mm' },
    });
    await browser.close();
    return Buffer.from(pdfBuffer);
  }

  async generateAllOrdersSheetPDF(): Promise<Buffer> {
    // Busca todas as comandas (ajuste a chamada conforme seu service!)
    const orders = await this.orderOnlineService.findAllOrdersForReport();

    // Prepara todos os HTMLs de comanda
    const templatePath = this.getTemplatePath();
    const hbsRaw = fs.readFileSync(templatePath, 'utf8');
    const hbsTemplate = handlebars.compile(hbsRaw);

    // Monta o data de todas as comandas (com agrupamento/qr)
    const templates = await Promise.all(
      orders.map((order) => this.buildOrderTemplateData(order)),
    );
    const renderedComandas = templates.map((data) => hbsTemplate(data));

    // Agrupa em páginas de 4 (2x2)
    const pages: string[] = [];
    for (let i = 0; i < renderedComandas.length; i += 4) {
      const cmds = renderedComandas.slice(i, i + 4);
      // Se passar menos de 4, completa com vazio
      while (cmds.length < 4) cmds.push('');
      pages.push(`
      <div class="page">
        <div class="row">
          <div class="comanda-box">${cmds[0]}</div>
          <div class="comanda-box">${cmds[1]}</div>
        </div>
        <div class="row">
          <div class="comanda-box">${cmds[2]}</div>
          <div class="comanda-box">${cmds[3]}</div>
        </div>
      </div>
    `);
    }

    // HTML final com múltiplas páginas
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <style>
        body { margin:0; padding:0; background: #fff; }
        .page {
          width: 210mm; height: 297mm;
          page-break-after: always;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .row {
          display: flex;
          width: 100%;
          justify-content: center;
          align-items: center;
        }
        .comanda-box {
          width: 100mm;
          height: 140mm;
          margin: 0;
          box-sizing: border-box;
          overflow: hidden;
          background: #fff;
          border: 0;
          display: block;
          page-break-inside: avoid;
        }
      </style>
    </head>
    <body>
      ${pages.join('\n')}
    </body>
    </html>
  `;

    // Renderiza com Puppeteer
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 1200000,
    });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '6mm', right: '0', bottom: '6mm', left: '0' },
    });
    await browser.close();
    return Buffer.from(pdfBuffer);
  }

  async generateAllOrdersSinglePDF(): Promise<Buffer> {
    const orders = await this.orderOnlineService.findAllOrdersForReport();
    const templatePath = this.getTemplatePath();
    const hbsRaw = fs.readFileSync(templatePath, 'utf8');
    const hbsTemplate = handlebars.compile(hbsRaw);

    // Prepara todos os HTMLs
    const templates = await Promise.all(
      orders.map((order) => this.buildOrderTemplateData(order)),
    );
    const renderedComandas = templates.map((data) => hbsTemplate(data));

    // Monta HTML com todas comandas, cada uma em sua própria página
    const pagesHtml = renderedComandas
      .map(
        (html, index) => `
    <div class="page" style="page-break-after: ${index < renderedComandas.length - 1 ? 'always' : 'auto'};">
      ${html}
    </div>
  `,
      )
      .join('\n');

    const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <style>
        body { margin: 0; padding: 0; }
        .page {
          width: 100mm;
          height: 140mm;
          overflow: hidden;
          page-break-inside: avoid;
        }
      </style>
    </head>
    <body>
      ${pagesHtml}
    </body>
    </html>
  `;

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(fullHtml, {
      waitUntil: 'networkidle0',
      timeout: 180000,
    });
    const pdfBuffer = await page.pdf({
      width: '100mm',
      height: '140mm',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      preferCSSPageSize: true,
    });
    await browser.close();
    return Buffer.from(pdfBuffer);
  }
}
