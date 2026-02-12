// src/common/validators/email.validator.ts

import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { EmailValidatorType } from 'src/common/types';

export function EmailValidator({
  fieldName,
  label,
  optional = false,
  description,
  exemple,
}: EmailValidatorType) {
  if (label === undefined) label = fieldName;

  if (optional === true) {
    return applyDecorators(
      IsEmail(
        {},
        {
          message: `Campo ${label} em formáto inválido`,
        },
      ),
      IsOptional(),
      ApiPropertyOptional({
        name: fieldName,
        description: description,
        example: exemple,
      }),
    );
  }
  return applyDecorators(
    IsEmail(
      {},
      {
        message: `Campo ${label} em formáto inválido`,
      },
    ),
    IsNotEmpty({
      message: `Campo ${label} é requirido`,
    }),
    ApiProperty({
      name: fieldName,
      description: description,
      example: exemple,
    }),
  );
}
