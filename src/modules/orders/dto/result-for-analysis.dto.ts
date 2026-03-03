// backend/src/modules/orders/dtos/send-to-analysis.dto.ts
import { BooleanValidator, StringValidator } from 'src/common/validators';

export class ResultForAnalysisDTO {
  @StringValidator({
    fieldName: 'orderId',
    label: 'ID do Pedido',
  })
  orderId: string;

  @BooleanValidator({
    fieldName: 'approved',
    label: 'Aprovado?',
  })
  approved: boolean;

  @StringValidator({
    fieldName: 'observations',
    label: 'Observações',
  })
  observations: string;
}
