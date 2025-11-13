export function MessageOrderDeliveryFailed(orderId: string) {
  const message = `❌ Não foi possível concluir a entrega do pedido #${orderId}. 
                    Em breve alguém da equipe entrará em contato.`;

  return message;
}
