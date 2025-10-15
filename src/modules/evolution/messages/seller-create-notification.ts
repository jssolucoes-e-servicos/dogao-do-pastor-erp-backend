export const SellerCreateNotification = (
  sellerName: string,
  cellName: string | undefined,
  cellTag: string,
): string => {
  let message = `🧑‍💻 *Dogão do Pastor - Cadastro de Vendedor* 🧑‍💻\n\nOlá, ${sellerName} a Paz de Cristo, temos alegria de informar que você foi cadastrado como vendedor em nossa plataforma.\n\n`;
  message += `Nome: ${sellerName}.\n\n`;
  message += `Célula de vinculo: ${cellName}.\n\n`;
  message += `TAG: ${cellTag}.\n\n`;
  message += `Segue abaixo o seu link de divulgação.`;
  message += `Boas vendas! 🙏`;
  return message;
};

export const SellerCreateNotificationLink = (cellTag: string): string => {
  return `https://igrejavivaemcelulas.com.br/dogao-do-pastor?v=${cellTag}`;
};
