import { StringValidator } from "src/common/validators";

export class ForScheduledDTO {
  @StringValidator({
    fieldName: 'orderId',
    label: 'ID do pedido',
  })
  orderId: string;

  @StringValidator({
    fieldName: 'scheduledTime',
    label: 'Horário de Retirada',
  })
  scheduledTime: string;
}
