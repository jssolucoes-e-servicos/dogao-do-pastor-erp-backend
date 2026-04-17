export function MW_CustomerNewEditionAnnouncement(customerName: string): string {
  const firstName = customerName.trim().split(' ')[0];
  return `Olá ${firstName}, tudo bem? 😊\n\nEstamos passando aqui para lhe avisar que uma nova edição do *Dogão do Pastor* está chegando! 🌭\n\nSerá no dia *16 de maio* e você já pode garantir o seu em nossa plataforma pelo link abaixo, ou diretamente com um de nossos vendedores.`;
}

export const MW_CustomerNewEditionLink = `https://igrejavivaemcelulas.com.br/dogao-do-pastor`;
