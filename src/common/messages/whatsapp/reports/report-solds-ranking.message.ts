/* import { ICountSoldsWithRank } from 'src/common/interfaces';

export function MessageReportSoldsRanking(report: ICountSoldsWithRank): string {
  const topCell = report.rank_cells[0];
  const topSeller = report.rank_sellers[0];

  const message = `
📊 *Relatório de Vendas*

🌭 Total de Dogões Vendidos: *${report.totalCount}*
💰 Valor Total: *R$ ${report.totalValue.toFixed(2)}*

🏆 *Top Célula:* ${topCell?.name ?? 'Nenhuma'} — ${topCell?.quantity ?? 0} dogs
⭐ *Top Vendedor:* ${topSeller?.name ?? 'Nenhum'} — ${topSeller?.quantity ?? 0} dogs

🧱 *Ranking de Células:*
${report.rank_cells
      .slice(0, report.rank_cells.length)
      .map((c, i) => `${i + 1}. ${c.name} — ${c.quantity}`)
      .join('\n')}

🧍 *Ranking de Vendedores:*
${report.rank_sellers
      .slice(0, report.rank_sellers.length)
      .map((s, i) => `${i + 1}. ${s.name} — ${s.quantity}`)
      .join('\n')}
    `.trim();

  return message;
}
 */
