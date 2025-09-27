//ENDEREÇO/NOME DO ARQUIVO: src/modules/payment/dto/payment.dto.ts
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';

export class PayerDto {
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsString()
  @IsNotEmpty()
  email: string;
}

export class PixPaymentRequest {
  @IsNumber()
  transactionAmount: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  externalReference: string;

  @IsUrl()
  @IsNotEmpty()
  callbackUrl: string;

  @IsObject()
  @ValidateNested()
  @Type(() => PayerDto)
  payer: PayerDto;
}

export class CardPaymentRequest {
  @IsNumber()
  transactionAmount: number;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  installments: number;

  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;

  @IsString()
  @IsNotEmpty()
  issuerId: string;

  @IsString()
  @IsNotEmpty()
  externalReference: string;

  @IsUrl()
  @IsNotEmpty()
  callbackUrl: string;

  @IsObject()
  @ValidateNested()
  @Type(() => PayerDto)
  payer: PayerDto;
}

// Interface genérica que o controlador pode usar
export type IPaymentRequest = PixPaymentRequest | CardPaymentRequest;

export interface IPaymentResponse {
  preOrderId: string;
  totalAmount: number;
  customerEmail: string | null;
}
