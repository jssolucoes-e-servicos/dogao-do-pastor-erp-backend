import { IGetSaleBySeller } from '@/common/interfaces';

export function MessageSellerTag(report: IGetSaleBySeller): string {
  const message = `
📦 *Relatório de Vendas - ${report.sellerName}*

🌭 Total de Dogs Vendidos: *${report.totalDogs}*

🧾 *Clientes e Quantidades:*
${report.sales
      .map((s, i) => `${i + 1}. ${s.customerName} — ${s.quantity} dogs`)
      .join('\n')}
    `.trim();
  return message;
}
