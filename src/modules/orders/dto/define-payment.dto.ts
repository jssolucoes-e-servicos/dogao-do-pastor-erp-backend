import { PaymentMethodEnum } from 'src/common/enums';
import { StringValidator } from 'src/common/validators';

export class DefinePaymetnDTO {
  @StringValidator({
    fieldName: 'orderId',
    label: 'ID do pedido',
  })
  orderId: string;

  @StringValidator({
    fieldName: 'method',
    label: 'Forma de pagamento selecionada',
  })
  method: PaymentMethodEnum;
}
