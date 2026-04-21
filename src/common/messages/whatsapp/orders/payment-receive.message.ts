import { PaymentMethodEnum } from 'src/common/enums';
import { NumbersHelper } from 'src/common/helpers/number.helper';
import { StringsHelper } from 'src/common/helpers/strings.helper';

export function MW_OrderPaymentReceive(
  name: string,
  count: number,
  totalValue: number,
  paymentType: PaymentMethodEnum,
): string {
  return `🌭 *Dogão do Pastor* 🌭\n\nOlá ${name}! 👋\n\nRecebemos seu pedido.\n\nQuantidade de Dogs: ${count}\nValor total: ${NumbersHelper.formatCurrency(totalValue)}\nForma de pagamento: ${StringsHelper.translatePaymentMethod(paymentType)}\n\nEm breve enviaremos seu comprovante. 🙏`;
}
