import { NumbersHelper } from 'src/common/helpers/number.helper';

export function MW_SellerDailyReport(
  sellerName: string,
  totalDogs: number,
): string {
  return `🎉 *E aí, ${sellerName}! Tudo bem?*\n\n` +
         `Passando pra te dar um retorno sobre as suas captações de vendas de hoje:\n` +
         `🌭 Você sozinho(a) já vendeu *${totalDogs} Dogões*!\n\n` +
         `Parabéns pela dedicação! Não para não 🙌🔥`;
}
