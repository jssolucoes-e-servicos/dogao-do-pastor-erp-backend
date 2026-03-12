// src/common/messages/whatsapp/orders/new-site.message.ts
import { OrderEntity } from 'src/common/entities';
import { NumbersHelper } from 'src/common/helpers/number.helper';
import { StringsHelper } from 'src/common/helpers/strings.helper';

export function MW_OrderNewSite(order: OrderEntity): string {
  const message = `🌭 *Dogão do Pastor* 🌭\n\nOlá ${order.customer.name}! 👋
                  \n\nRecebemos seu pedido.
                  \n\nQuantidade de Dogs: ${order.items?.length} 
                  \n\nValor total: ${NumbersHelper.formatCurrency(order.totalValue)}
                  \n\nForma de pagamento: ${StringsHelper.translatePaymentMethod(order.paymentType)}
                  \n\nSeu pedido ainda está aguardando o pagamento.
                  \n\n 🙏 Deus abençoe!`;

  return message;
}
