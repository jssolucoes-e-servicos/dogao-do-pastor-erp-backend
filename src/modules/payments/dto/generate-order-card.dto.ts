// src/modules/payments/dto/generate-order-card.dto.ts
import { NestedValidator, NumberValidator, StringValidator } from 'src/common/validators';

class CardPayerDto {
  @StringValidator({
    fieldName: 'name',
    label: 'Nome',
    optional: true,
  })
  name?: string;

  @StringValidator({
    fieldName: 'email',
    label: 'E-mail',
    optional: true,
  })
  email?: string;
}

export class GenerateOrderCardDTO {
  @StringValidator({
    fieldName: 'orderId',
    label: 'ID do Pedido',
    optional: true,
  })
  orderId: string;

  @StringValidator({
    fieldName: 'token',
    label: 'Token do cartão',
  })
  token: string;

  @NumberValidator({
    fieldName: 'installments',
    label: 'valor',
  })
  installments: number;

  @NestedValidator({
    fieldName: 'payer',
    label: 'Pagador',
    optional: true,
    dto: CardPayerDto,
  })
  payer?: CardPayerDto;
}
