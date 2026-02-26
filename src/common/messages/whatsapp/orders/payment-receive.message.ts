import { PaymentMethodEnum } from 'src/common/enums';
import { NumbersHelper } from 'src/common/helpers/number.helper';
import { StringsHelper } from 'src/common/helpers/strings.helper';

export function MW_OrderPaymentReceive(
  name: string,
  count: number,
  totalValue: number,
  paymentType: PaymentMethodEnum,
): string {
  const message = `🌭 *Dogão do Pastor* 🌭\n\nOlá ${name}! 👋
                  \n\nÉ com elegria que informamos que seu pagamento foi confirmado.
                  \n\nQuantidade de Dogs: ${count} 
                  \n\nValor total: ${NumbersHelper.formatCurrency(totalValue)}
                  \n\nForma de pagamento: ${StringsHelper.translatePaymentMethod(paymentType)}
                  \n\n 🙏 Deus abençoe!`;

  return message;
}