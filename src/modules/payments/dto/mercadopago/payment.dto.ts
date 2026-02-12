import {
  NestedValidator,
  NumberValidator,
  StringValidator,
} from 'src/common/validators';

export class MPPayerDto {
  @StringValidator({
    fieldName: 'first_name',
    label: 'first_name',
  })
  first_name: string;

  @StringValidator({
    fieldName: 'last_name',
    label: 'last_name',
  })
  last_name: string;

  @StringValidator({
    fieldName: 'email',
    label: 'email',
  })
  email: string;
}

export class MPPixPaymentRequest {
  @NumberValidator({
    fieldName: 'transactionAmount',
    label: 'transactionAmount',
  })
  transactionAmount: number;

  @StringValidator({
    fieldName: 'description',
    label: 'description',
  })
  description: string;

  @StringValidator({
    fieldName: 'externalReference',
    label: 'externalReference',
  })
  externalReference: string;

  @StringValidator({
    fieldName: 'callbackUrl',
    label: 'callbackUrl',
  })
  callbackUrl: string;

  @NestedValidator({
    fieldName: 'payer',
    label: 'Pagador',
    dto: MPPayerDto,
  })
  payer: MPPayerDto;
}

export class MPCardPaymentRequest {
  @NumberValidator({
    fieldName: 'transactionAmount',
    label: 'transactionAmount',
  })
  transactionAmount: number;

  @StringValidator({
    fieldName: 'token',
    label: 'token',
  })
  token: string;

  @StringValidator({
    fieldName: 'description',
    label: 'description',
  })
  description: string;

  @NumberValidator({
    fieldName: 'installments',
    label: 'installments',
  })
  installments: number;

  @StringValidator({
    fieldName: 'paymentMethodId',
    label: 'paymentMethodId',
  })
  paymentMethodId: string;

  @StringValidator({
    fieldName: 'issuerId',
    label: 'issuerId',
  })
  issuerId: string;

  @StringValidator({
    fieldName: 'externalReference',
    label: 'externalReference',
  })
  externalReference: string;

  @StringValidator({
    fieldName: 'callbackUrl',
    label: 'callbackUrl',
  })
  callbackUrl: string;

  @NestedValidator({
    fieldName: 'payer',
    label: 'Pagador',
    dto: MPPayerDto,
  })
  payer: MPPayerDto;
}

export type IMPPaymentRequest = MPPixPaymentRequest | MPCardPaymentRequest;

export interface IMPPaymentResponse {
  orderId: string;
  totalAmount: number;
  customerEmail: string | null;
}
