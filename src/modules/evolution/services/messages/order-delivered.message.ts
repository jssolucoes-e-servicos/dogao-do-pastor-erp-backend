export function MessageOrderDelivered(orderId: string): string {
  const message = `✅ Seu pedido #${orderId} foi entregue. Obrigado!`;
  return message;
}
