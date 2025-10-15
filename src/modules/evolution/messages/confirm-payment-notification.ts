import { formatCurrency } from '@/common/helpers/formats.helper';
import { OrderOnlineFullRetrieveDTO } from '@/modules/order-online/dto/order-online-full-retrieve.dto';

export const ConfirmPaymentNotification = (
  order: OrderOnlineFullRetrieveDTO,
): string => {
  let paymentType: string = 'PIX';
  switch (order.paymentMethod) {
    case 'card':
      paymentType = 'Cartão';
      break;
    case 'pix':
      paymentType = 'PIX';
      break;
    default:
      paymentType = 'PIX';
      break;
  }

  let deliveryType: string = 'Retirada de sede da IVC.';
  switch (order.deliveryOption) {
    case 'pickup':
      deliveryType = 'Retirada de sede da IVC.';
      break;
    case 'delivery':
      deliveryType = 'Receber no endereço';
      break;
    case 'donate':
      deliveryType = 'Doação.';
      break;
    default:
      deliveryType = 'Retirada de sede da IVC.';
      break;
  }

  let message = `🤑 *Dogão do Pastor - Confirmação de pagamento* 🤑\n\nOlá, ${order.customer?.name} a Paz de Cristo, recebemos a confirmação de pagamento de seu pedido.\n\n`;
  message += `Cliente: *${order.customer?.name}*.\n\n`;
  message += `Quantidade : *${order.quantity}*.\n\n`;
  message += `Valor total: *${formatCurrency(order.valueTotal)}*.\n\n`;
  message += `Forma de pagamento: *${paymentType}*`;
  message += `Pedido para: *${deliveryType}*`;
  message += `Obrigado pela compra! 🙏`;
  return message;
};

export const ConfirmPaymentNotificationLink = (orderId: string): string => {
  return `https://dogao.igrejavivaemcelulas.com.br/acompanhar-pedido/${orderId}`;
};
