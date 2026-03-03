
export function MW_OrderSendAnalisys(
  orderId: string,
  customerName: string,
  customerCPF: string,
  distance: string,
  //addressInline: string,
): string {
  let message = `🚚 *Dogão do Pastor - Solicitação de Analise* 🚚\n\nOlá, temos um novo pedido para analise.\n\n`;
  message += `Pedido: ${orderId}.\n\n`;
  message += `Cliente: [ ${customerCPF} ] ${customerName}.\n\n`;
  //message += `Endereço: ${addressInline}.\n\n`;
  message += `Distância do Endereço até a sede: ${distance}km.\n\n`;
  message += `link de analise: ${process.env.FRONTEND_ERP_URL}/app/analise-distancia/${orderId}`;

  return message;
}
