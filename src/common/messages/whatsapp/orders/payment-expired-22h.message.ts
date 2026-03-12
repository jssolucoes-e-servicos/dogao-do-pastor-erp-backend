export const MW_OrderPaymentExpired22h = (customerName: string, orderId: string): string => {
  const message = `🌭 *Dogão do Pastor*\n\n
  Poxa, ${customerName}... Infelizmente o tempo do seu pagamento expirou e nós tivemos que cancelar a sua tentativa atual de pedido. 😔
  \n\nMas não fique triste! Se ainda quiser garantir o seu Dogão, você pode solicitar um novo pagamento em nosso site de forma super rápida:
  \n\n👉 https://dogao.igrejavivaemcelulas.com.br/comprar/${orderId}/pagamento
  \n\nEsperamos te ver em breve!`;

  return message
};
