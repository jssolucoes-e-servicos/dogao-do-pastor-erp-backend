import { StringValidator } from "src/common/validators";

export class OrderIdOnly {
  @StringValidator({
    fieldName: 'orderId',
    label: 'ID do pedido',
  })
  orderId: string;
}
