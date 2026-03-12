import { NumbersHelper } from 'src/common/helpers/number.helper';

export function MW_CellDailyReport(
  leaderName: string,
  cellName: string,
  dogsTotal: number,
  sellers: { name: string; totalDogs: number }[],
): string {
  return `🤝 Salve líder ${leaderName}!\n\n` +
         `Veja como foi o desempenho da célula *${cellName}* até agora:\n\n` +
         `🌭 Total de Dogões Vendidos: ${dogsTotal}\n\n` +
         `*Vendas por membro:*\n` +
         sellers.map((s) => `• ${s.name}: ${s.totalDogs} dogs`).join('\n') + `\n\n` +
         `Continuem engajando a galera, cada venda faz a diferença na nossa obra! 🙏🔥`;
}
