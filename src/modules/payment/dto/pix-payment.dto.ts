// src/modules/payment/dto/pix-payment.dto.ts
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';

class PayerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  surname?: string;

  @IsString()
  @IsNotEmpty()
  email: string;
  phone?: {
    area_code: string;
    number: string;
  };
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
