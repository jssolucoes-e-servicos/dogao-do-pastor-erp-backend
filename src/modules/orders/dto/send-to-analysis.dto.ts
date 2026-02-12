// backend/src/modules/orders/dtos/send-to-analysis.dto.ts
import { NumberValidator, StringValidator } from 'src/common/validators';

export class SendToAnalysisDTO {
  @StringValidator({
    fieldName: 'orderId',
    label: 'ID do Pedido',
  })
  orderId: string;

  @StringValidator({
    fieldName: 'customerAddressId',
    label: 'ID do Endereço',
  })
  customerAddressId: string;

  @NumberValidator({
    fieldName: 'distance',
    label: 'Distância em KM',
  })
  distance: number;
}
