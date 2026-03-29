import {
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { BaseService } from 'src/common/services/base.service';
import { OrdersService } from 'src/modules/orders/services/orders.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as path from 'path';
import * as QRCode from 'qrcode';
import * as puppeteer from 'puppeteer';
import { LogoInB64 } from '../base64/logo';
import { N8nService } from 'src/modules/n8n/services/n8n.service';

@Injectable()
export class OrdersReportService extends BaseService {
  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    configService: ConfigService,
    private readonly ordersService: OrdersService,
    private readonly n8nService: N8nService,
  ) {
    super(configService, loggerService, prismaService);
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

    // Agrupa itens do Pedido Unificado Novo (OrderEntity)
    let items: { qty: number; name: string }[] = [];
    if (order.items && order.items.length) {
      const grouped: { [key: string]: number } = {};
      for (const item of order.items) {
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
        address: `${order.address?.street ?? ''}, ${order.address?.number ?? ''}`,
        reference: order.address?.complement ?? '',
      },
      seller: {
        name: order.seller?.name ?? '',
        phone: order.seller?.contributor?.phone ?? '',
        cellGroup: order.seller?.cell?.name ?? '',
        leader: order.seller?.cell?.leader?.name ?? '',
        cellPhone: order.seller?.cell?.leader?.phone ?? '',
      },
      items,
      notes: order.observations ?? '',
      id: order.id ?? '',
      link: url,
      qrCode: qrCodeBase64,
    };
  }

  async generateHtmlPreviewOrderIndividual(
    orderId: string,
  ): Promise<string> {
    const order = await this.ordersService.findById(orderId);
    if (!order) {
        throw new NotFoundException('Pedido não encontrado para emitir comanda');
    }
    const templateData = await this.buildOrderTemplateData(order);
    const templatePath = this.getTemplatePath();
    const hbsRaw = fs.readFileSync(templatePath, 'utf8');
    const hbsTemplate = handlebars.compile(hbsRaw);
    return hbsTemplate(templateData);
  }

  async generateAllOrdersHtmlPreview(): Promise<string> {
    // Retorna pedidos da edição atual que estão em filar/preparação/etc
    // Pegaremos todos que a comanda não está finalizada ainda. (Fila)
    const orders = await this.prisma.order.findMany({
        where: {
            active: true,
            status: { in: ['QUEUE', 'PRODUCTION', 'EXPEDITION', 'DELIVERING'] }
        },
        include: {
            customer: true,
            address: true,
            items: true,
            seller: { 
                include: { 
                    contributor: true,
                    cell: { include: { leader: true } }
                }
            }
        }
    });

    const templatePath = this.getTemplatePath();
    const hbsRaw = fs.readFileSync(templatePath, 'utf8');
    const hbsTemplate = handlebars.compile(hbsRaw);

    const templates = await Promise.all(
        orders.map((order) => this.buildOrderTemplateData(order)),
    );
    const renderedComandas = templates.map((data) => hbsTemplate(data));

    // Montar multiplas paginas em um unicio HTML iteravel:
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
    <body onload="window.print()">
      ${pagesHtml}
    </body>
    </html>
  `;

    return fullHtml;
  }

  async generateAllOrdersSinglePDF(): Promise<Buffer> {
    const fullHtml = await this.generateAllOrdersHtmlPreview();

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
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

  async generateAllOrdersSheetPDF(): Promise<Buffer> {
    const orders = await this.prisma.order.findMany({
        where: {
            active: true,
            status: { in: ['QUEUE', 'PRODUCTION', 'EXPEDITION', 'DELIVERING'] }
        },
        include: {
            customer: true,
            address: true,
            items: true,
            seller: { 
                include: { 
                    contributor: true,
                    cell: { include: { leader: true } }
                }
            }
        }
    });

    const templatePath = this.getTemplatePath();
    const hbsRaw = fs.readFileSync(templatePath, 'utf8');
    const hbsTemplate = handlebars.compile(hbsRaw);

    const templates = await Promise.all(
      orders.map((order) => this.buildOrderTemplateData(order)),
    );
    const renderedComandas = templates.map((data) => hbsTemplate(data));

    // Agrupa em páginas de 4 (2x2)
    const pages: string[] = [];
    for (let i = 0; i < renderedComandas.length; i += 4) {
      const cmds = renderedComandas.slice(i, i + 4);
      while (cmds.length < 4) cmds.push(''); // preenche espaço q sobrar
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

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 1200000,
    });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '3mm', right: '0', bottom: '3mm', left: '0' },
    });
    await browser.close();
    return Buffer.from(pdfBuffer);
  }

  async getFailedPendingOrdersData(editionId: string): Promise<any> {
    const edition = await this.prisma.edition.findUnique({
      where: { id: editionId },
      select: { name: true },
    });

    if (!edition) {
      throw new NotFoundException('Edição não encontrada');
    }

    const orders = await this.prisma.order.findMany({
      where: {
        editionId,
        paymentStatus: { in: ['FAILED', 'PENDING'] },
        active: true,
      },
      include: {
        items: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerCPF: order.customerCPF,
      totalValue: order.totalValue,
      totalValueFormatted: order.totalValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      deliveryOption: order.deliveryOption,
      paymentType: order.paymentType,
      paymentStatus: order.paymentStatus,
      itemsCount: order.items.length,
      createdAt: order.createdAt,
    }));

    return {
      editionName: edition.name,
      generationDate: new Date().toLocaleString('pt-BR'),
      orders: formattedOrders,
      totalOrders: formattedOrders.length,
    };
  }

  async dispatchReportToN8n(
    editionId: string,
    format: 'pdf' | 'excel',
  ): Promise<any> {
    const data = await this.getFailedPendingOrdersData(editionId);
    return this.n8nService.dispatchEvent('REPORT_GENERATION', {
      editionId,
      format,
      ...data,
    }, 'failed-pending-orders-webhook');
  }
}
