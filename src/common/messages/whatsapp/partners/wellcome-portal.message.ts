import { PartnerEntity } from 'src/common/entities';

export function MW_PartnerWellcomePortal(partner: PartnerEntity): string {
  const loginUrl = `${process.env.FRONTEND_PORTALS_URL}/portal-parceiro/acesso`;
  const message = `*Bem-vindo ao Dogão do Pastor!* 🌭🙏\n\n` +
      `Olá *${partner.responsibleName}*, sua instituição *${partner.name}* já está ativa no sistema.\n\n` +
      `*Dados de Acesso:*\n` +
      `• CNPJ: ${partner.cnpj}\n` +
      `• Link de Acesso: ${loginUrl}\n\n` +
      `Agora você já pode gerenciar suas doações e parceiros. Estamos felizes em ter você conosco!`;

  return message;
}
