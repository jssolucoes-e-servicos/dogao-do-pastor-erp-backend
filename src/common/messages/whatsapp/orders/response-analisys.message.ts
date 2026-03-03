export function MW_OrderResponseAnalisys(
  orderId: string,
  approved: boolean,
): string {
  let message = `🚚 *Dogão do Pastor - Resposta da Analise* 🚚\n\nRealizada a analise de seu pedido.\n\n`;
  message += `Solicitação: Entrega em distância excedente.\n\n`;
  message += `Resultado: ${approved ? 'Aprovado' : 'Reprovado'}.\n\n`;
  message += approved
    ? `Acesse o link abaixo para efetuar o pagamento.`
    : `Acesso o link abaixo para alterar seu pedido`;
  message += `${process.env.FRONTEND_PORTALS_URL}/comprar/${orderId}`;

  return message;
}
