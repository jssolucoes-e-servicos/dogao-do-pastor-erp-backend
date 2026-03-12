import { NumbersHelper } from 'src/common/helpers/number.helper';

export function MW_NetworkDailyReport(
  supervisorName: string,
  networkName: string,
  dogsTotal: number,
  cells: { name: string; totalDogs: number }[],
): string {
  return `🔥 Olá supervisor(a) ${supervisorName}!\n\n` +
         `Confira o consolidado das vendas de todas as células da *${networkName}* até o momento:\n\n` +
         `🌭 Total de Dogões da Rede: ${dogsTotal}\n\n` +
         `*Desempenho por Célula:*\n` +
         cells.map((c) => `• ${c.name}: ${c.totalDogs} dogs`).join('\n') + `\n\n` +
         `Sua liderança inspira! Vamos juntos bater nossas metas! 🙌🚀`;
}
