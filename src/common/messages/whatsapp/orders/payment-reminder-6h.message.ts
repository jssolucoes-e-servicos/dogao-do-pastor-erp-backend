export const MW_OrderPaymentReminder6h = (customerName: string): string => {
  const message = `🌭 *Dogão do Pastor - Lembrete amigável!*\n\nOlá ${customerName}, vimos que você iniciou um pedido com a gente há algumas horinhas, mas ainda não recebemos a confirmação do pagamento.
                  \n\nAinda dá tempo de garantir o seu Dogão! Se estiver com alguma dificuldade ou se já tiver feito o pagamento e ele não apareceu aqui, mande uma mensagem pra gente.
                  \n\nEstamos te esperando! 😋`;

  return message;
};
