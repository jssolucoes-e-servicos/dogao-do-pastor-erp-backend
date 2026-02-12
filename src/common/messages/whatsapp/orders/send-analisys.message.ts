import { OrderEntity } from 'src/common/entities';

export function MW_OrderSendAnalisys(
  order: OrderEntity,
  distance: string,
  addressInline: string,
): string {
  let message = `🚚 *Dogão do Pastor - Solicitação de Analise* 🚚\n\nOlá, temos um novo pedido para analise.\n\n`;
  message += `Pedido: ${order.id}.\n\n`;
  message += `Cliente: [ ${order.customerCPF} ] ${order.customerName}.\n\n`;
  message += `Endereço: ${addressInline}.\n\n`;
  message += `Distância do Endereço até a sede: ${distance}km.\n\n`;
  message += `link de analise: ${process.env.FRONTEND_ERP_URL}/app/analise-distancia/${order.id}`;

  return message;
}
