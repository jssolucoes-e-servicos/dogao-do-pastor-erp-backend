import { StringValidator } from 'src/common/validators';

export class GenerateOrderPixDTO {
  @StringValidator({
    fieldName: 'orderId',
    label: 'ID do Pedido',
    optional: true,
  })
  orderId: string;
}
