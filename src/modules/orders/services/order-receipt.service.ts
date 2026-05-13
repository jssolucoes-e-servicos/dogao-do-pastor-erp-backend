import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/helpers/importer.helper';
import * as puppeteer from 'puppeteer';
import { Company } from 'src/common/constants/company';
import { UploadsService } from 'src/modules/uploads/services/uploads.service';
import { LogoInB64 } from 'src/modules/reports/base64/logo';

@Injectable()
export class OrderReceiptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  // ── Gera o HTML do comprovante ────────────────────────────────────────

  private buildHtml(order: any): string {
    // Agrupa por ingredientes e se é brinde
    const grouped: Record<string, { qty: number; isPromo: boolean; name: string }> = {};
    for (const item of order.items ?? []) {
      const ingredientName = (item.removedIngredients ?? []).length > 0
        ? `Sem ${item.removedIngredients.join(', ')}`
        : 'Dogão Completo';
      
      const key = `${ingredientName}-${item.isPromo ? 'promo' : 'paid'}`;
      
      if (!grouped[key]) {
        grouped[key] = { qty: 0, isPromo: !!item.isPromo, name: ingredientName };
      }
      grouped[key].qty++;
    }

    const dogPrice = order.edition?.dogPrice ?? 24.99;
    let promoCount = 0;
    
    let itemsHtml = Object.values(grouped)
      .map((data) => {
        if (data.isPromo) promoCount += data.qty;
        
        const priceDisplay = data.isPromo 
          ? '<span style="color:#16a34a">Brinde do combo</span>' 
          : (data.qty * dogPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          
        return `
        <tr>
          <td>${data.qty}x</td>
          <td>${data.name} ${data.isPromo ? '<br/><span style="color:#16a34a; font-size:9px; font-weight:bold; text-transform:uppercase">Promoção 5+1</span>' : ''}</td>
          <td style="text-align:right">${priceDisplay}</td>
        </tr>`;
      })
      .join('');

    // Adiciona a Coca-Cola se houver brindes (1 por combo/brinde)
    if (promoCount > 0) {
      itemsHtml += `
        <tr>
          <td>${promoCount}x</td>
          <td>Coca-Cola 2L <br/><span style="color:#16a34a; font-size:9px; font-weight:bold; text-transform:uppercase">Brinde Combo</span></td>
          <td style="text-align:right"><span style="color:#16a34a">Grátis</span></td>
        </tr>`;
    }

    const PAYMENT_LABEL: Record<string, string> = {
      PIX: 'PIX', CARD_CREDIT: 'Cartão de Crédito', CARD_DEBIT: 'Cartão de Débito',
      MONEY: 'Dinheiro', POS: 'Maquininha', UNDEFINED: '—',
    };
    const DELIVERY_LABEL: Record<string, string> = {
      PICKUP: 'Retirada no Local', DELIVERY: 'Entrega', DONATE: 'Doação',
    };

    // Usa o mesmo logo PNG base64 das comandas
    const logoHtml = `<img src="${LogoInB64}" alt="Dogão do Pastor" class="logo-img" />`;

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Helvetica Neue',Arial,sans-serif; font-size:13px; color:#1a1a1a; background:#fff; padding:32px; max-width:480px; margin:0 auto; }
  .header { text-align:center; margin-bottom:24px; border-bottom:2px solid #ea580c; padding-bottom:16px; }
  .logo-img { height:60px; max-width:240px; object-fit:contain; }
  .logo-text { font-size:22px; font-weight:900; color:#ea580c; text-transform:uppercase; }
  .badge { display:inline-block; background:#ea580c; color:#fff; font-size:11px; font-weight:700; padding:3px 10px; border-radius:99px; margin-top:8px; }
  .section { margin-bottom:20px; }
  .section-title { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#999; margin-bottom:8px; }
  .row { display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #f0f0f0; }
  .label { color:#666; }
  .value { font-weight:600; text-align:right; }
  table { width:100%; border-collapse:collapse; }
  table td { padding:6px 0; border-bottom:1px solid #f0f0f0; }
  table td:first-child { color:#ea580c; font-weight:700; width:32px; }
  .total td { padding-top:12px; border-bottom:none; font-size:16px; font-weight:900; color:#ea580c; }
  .footer { text-align:center; margin-top:24px; padding-top:16px; border-top:1px solid #eee; font-size:11px; color:#999; }
  .paid { color:#16a34a; font-weight:700; }
  .pending { color:#d97706; font-weight:700; }
</style>
</head>
<body>
  <div class="header">
    ${logoHtml}
    <div class="badge">Comprovante de Compra</div>
  </div>
  <div class="section">
    <div class="section-title">Pedido</div>
    <div class="row"><span class="label">Nº</span><span class="value">#${order.id.slice(-8).toUpperCase()}</span></div>
    <div class="row"><span class="label">Edição</span><span class="value">${order.edition?.name ?? '—'}</span></div>
    <div class="row"><span class="label">Data</span><span class="value">${new Date(order.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</span></div>
    <div class="row"><span class="label">Vendedor</span><span class="value">${order.seller?.name ?? order.sellerTag}</span></div>
  </div>
  <div class="section">
    <div class="section-title">Cliente</div>
    <div class="row"><span class="label">Nome</span><span class="value">${order.customerName}</span></div>
    <div class="row"><span class="label">Telefone</span><span class="value">${order.customerPhone}</span></div>
    <div class="row"><span class="label">Entrega</span><span class="value">${DELIVERY_LABEL[order.deliveryOption] ?? order.deliveryOption}</span></div>
  </div>
  <div class="section">
    <div class="section-title">Itens</div>
    <table>
      ${itemsHtml}
      <tr class="total"><td colspan="2">Total</td><td style="text-align:right">${order.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr>
    </table>
  </div>
  <div class="section">
    <div class="section-title">Pagamento</div>
    <div class="row"><span class="label">Forma</span><span class="value">${PAYMENT_LABEL[order.paymentType] ?? order.paymentType}</span></div>
    <div class="row"><span class="label">Status</span><span class="value ${order.paymentStatus === 'PAID' ? 'paid' : 'pending'}">${order.paymentStatus === 'PAID' ? '✓ Pago' : 'Aguardando pagamento'}</span></div>
  </div>
  <div class="footer">
    <p>${Company.name}</p>
    <p>${Company.address.inLine}</p>
    <p style="margin-top:6px">Obrigado pela sua compra! 🙏</p>
  </div>
</body>
</html>`;
  }

  // ── Gera PDF em buffer ────────────────────────────────────────────────

  async generatePdfBuffer(orderId: string): Promise<{ buffer: Buffer; order: any }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { where: { active: true } },
        edition: { select: { name: true, code: true, dogPrice: true } },
        seller: { select: { name: true, tag: true } },
      },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');

    const html = this.buildHtml(order);
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
      const pdf = await page.pdf({
        format: 'A5',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });
      return { buffer: Buffer.from(pdf), order };
    } finally {
      await browser.close();
    }
  }

  // ── Gera, salva no MinIO e retorna URL pública ────────────────────────

  async generateAndSave(orderId: string): Promise<string> {
    // Verifica se já existe URL salva
    const existing = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true } as any,
    });
    if (!existing) throw new NotFoundException('Pedido não encontrado');

    const { buffer } = await this.generatePdfBuffer(orderId);
    const { url } = await this.uploads.uploadBuffer(
      buffer,
      `comprovante-${orderId}.pdf`,
      'orders',
      'application/pdf',
    );
    return url;
  }

  // ── Endpoint: stream direto (fallback para visualização) ─────────────

  async generateReceiptPdf(orderId: string): Promise<Buffer> {
    const { buffer } = await this.generatePdfBuffer(orderId);
    return buffer;
  }
}
