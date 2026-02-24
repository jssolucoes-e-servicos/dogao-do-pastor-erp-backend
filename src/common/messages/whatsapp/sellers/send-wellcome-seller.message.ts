import { SellerEntity } from 'src/common/entities';

export function MW_SendWellcomeSeller(seller: SellerEntity): string {
  const message =
    `*Dogão do Pastor!* 🌭🙏\n\n` +
    `Oi ${seller.contributor.name},a Paz de Cristo!\n\n` +
    `Você esta recebendo o seu link vendas para divulgação.\n\n` +
    `Divulgue sem moderação.`;
  return message;
}
