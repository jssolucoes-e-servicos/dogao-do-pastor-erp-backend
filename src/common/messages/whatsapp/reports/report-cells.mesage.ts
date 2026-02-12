/* import { SellerReportCache } from 'src/modules/reports/interfaces/SellerReportCache.interface';

export function MessageReportCell(cellSummary: {
  Orders: number;
  Dogs: number;
  Total: number;
  sellers: SellerReportCache[];
}): string {
  const sellersList = cellSummary.sellers
    .map(
      (v) =>
        `• ${v.Seller}: ${v.Orders} pedidos, ${v.Dogs} dogs (R$ ${v.Total.toFixed(2)})`,
    )
    .join('\n');

  const message = `🌭 *Dogão do Pastor - Relatório da Célula* 🌭
                  📊 Resumo total:
                  • Pedidos: ${cellSummary.Orders}
                  • Dogs: ${cellSummary.Dogs}
                  • Total: R$ ${cellSummary.Total.toFixed(2)}

                  👥 *Vendedores:*
                  ${sellersList}
                  
                  Deus abençoe sua liderança! 🙏`;
  return message;
}
 */
