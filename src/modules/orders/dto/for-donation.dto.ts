import { StringValidator } from "src/common/validators";

export class ForDonationDTO {
  @StringValidator({
    fieldName: 'orderId',
    label: 'ID do pedido',
  })
  orderId: string;

  @StringValidator({
    fieldName: 'partnerId',
    label: 'ID do parceiro',
  })
  partnerId: string;
}
