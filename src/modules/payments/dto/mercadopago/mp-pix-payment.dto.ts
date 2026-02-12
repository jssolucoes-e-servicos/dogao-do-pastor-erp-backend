// src/modules/payment/dto/pix-payment.dto.ts
import {
  EmailValidator,
  NestedValidator,
  NumberValidator,
  StringValidator,
} from 'src/common/validators';

class MPPhoneType {
  @StringValidator({
    fieldName: 'area_code',
    label: 'Código de area',
  })
  area_code: string;

  @StringValidator({
    fieldName: 'number',
    label: 'Número',
  })
  number: string;
}

class MPPayerDto {
  @StringValidator({
    fieldName: 'name',
    label: 'Nome',
  })
  name: string;

  @StringValidator({
    fieldName: 'surname',
    label: 'sobrenome',
  })
  surname?: string;

  @EmailValidator({
    fieldName: 'email',
    label: 'E-mail',
  })
  email: string;

  @NestedValidator({
    fieldName: 'phone',
    label: 'Telefone',
    optional: true,
    dto: MPPhoneType,
  })
  phone?: MPPhoneType;
}

export class MPPixPaymentRequest {
  @NumberValidator({
    fieldName: 'transactionAmount',
    label: 'Valor da transação',
  })
  transactionAmount: number;

  @StringValidator({
    fieldName: 'description',
    label: 'Descrição',
  })
  description: string;

  @StringValidator({
    fieldName: 'externalReference',
    label: 'Referência externa',
  })
  externalReference: string;

  @StringValidator({
    fieldName: 'callbackUrl',
    label: 'URL de callback',
  })
  callbackUrl: string;

  @NestedValidator({
    fieldName: 'payer',
    label: 'Pagador',
    dto: MPPayerDto,
  })
  payer: MPPayerDto;
}
