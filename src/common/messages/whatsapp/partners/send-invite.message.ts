import { PartnerEntity } from 'src/common/entities';

export function MW_SendInvite(partner: PartnerEntity): string {
  const loginUrl = `${process.env.FRONTEND_PORTALS_URL}/parceiros/cadastro/${partner.id}`;
  const message =
    `*Dogão do Pastor!* 🌭🙏\n\n` +
    `Olá, você esta recebenco um link de convite para cadastrar sua instituição como parceira do Dogão, podendo assim receber doações de pedidos.\n\n` +
    `Acesse o link abaixo e conclua seu cadastro\n` +
    `${loginUrl}`;
  return message;
}
