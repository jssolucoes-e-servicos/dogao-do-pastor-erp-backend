import { NumbersHelper } from 'src/common/helpers/number.helper';

export function MW_GlobalRankingReport(
  totalDogs: number,
  cellsRanking: { cellName: string; dogsTotal: number }[],
  sellersRanking: { sellerName: string; totalDogs: number }[],
): string {
  return `🏆 *Ranking Global Diário*\n\n` +
         `📊 *Resumo Geral*\n` +
         `🌭 Total de Dogões Vendidos: ${totalDogs}\n\n` +
         `🔥 *Top Células*\n` +
         cellsRanking.map((c, i) => `${i + 1}º - ${c.cellName} (${c.dogsTotal} dogs)`).join('\n') + `\n\n` +
         `🔥 *Top Vendedores*\n` +
         sellersRanking.map((s, i) => `${i + 1}º - ${s.sellerName} (${s.totalDogs} dogs)`).join('\n');
}
