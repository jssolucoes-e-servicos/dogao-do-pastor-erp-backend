export function MessageOrderAnalisys(
  preorderId: string,
  customerName: string | null,
  cpf: string | null,
  distance: string,
  addressInline: string,
): string {
  let message = `🚚 *Dogão do Pastor - Solicitação de Analise* 🚚\n\nOlá, temos um novo pedido para analise.\n\n`;
  message += `Pedido: ${preorderId}.\n\n`;
  message += `Cliente: [ ${cpf} ] ${customerName}.\n\n`;
  message += `Endereço: ${addressInline}.\n\n`;
  message += `Distância do Endereço até a sede: ${distance}km.\n\n`;
  message += `link de analise: https://erp-dogao.igrejavivaemcelulas.com.br/app/analise-distancia/${preorderId}`;

  return message;
}
