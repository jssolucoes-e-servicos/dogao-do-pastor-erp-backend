import { StringValidator } from "src/common/validators";

export class ForDeliveryDTO {
  @StringValidator({
    fieldName: 'orderId',
    label: 'ID do pedido',
  })
  orderId: string;

  @StringValidator({
    fieldName: 'addressId',
    label: 'ID do Endereço',
  })
  addressId: string;
}
