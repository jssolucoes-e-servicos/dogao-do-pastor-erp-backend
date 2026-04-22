export function MW_ContributorWelcomeCredentials(name: string, username: string): string {
  const firstName = name.trim().split(' ')[0];
  return `Olá ${firstName}! 👋\n\nSeja bem-vindo(a) à equipe do *Dogão do Pastor*! 🌭🙏\n\nSuas credenciais de acesso a plataforma foram criadas:\n\n👤 *Usuário:* ${username}\n🔑 *Senha inicial:* dogao@2026\n\nAcesse o sistema pelo link abaixo ou pelo aplicativo de Android Dogão Equipe, se quiser, altere sua senha após o primeiro acesso.`;
}

export const MW_ContributorSystemLink = `https://dogao.igrejavivaemcelulas.com.br/erp`;
