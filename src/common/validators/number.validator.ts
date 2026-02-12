// src/common/validators/number.validator.ts

import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { NumberValidatorType } from 'src/common/types';

export function NumberValidator({
  fieldName,
  label,
  optional = false,
  min,
  description,
  exemple,
}: NumberValidatorType) {
  if (label === undefined) label = fieldName;

  const decorators = [
    IsNumber(
      {},
      {
        message: `Campo ${label} em formato inválido`,
      },
    ),
  ];

  if (min !== undefined) {
    decorators.push(
      Min(min, {
        message: `Campo ${label} deve ser maior ou igual a ${min}`,
      }),
    );
  }

  if (optional === true) {
    decorators.push(IsOptional());
    decorators.push(
      ApiPropertyOptional({
        name: fieldName,
        description,
        example: exemple,
      }),
    );
  } else {
    decorators.push(
      IsNotEmpty({
        message: `Campo ${label} é requerido`,
      }),
    );
    decorators.push(
      ApiProperty({
        name: fieldName,
        description,
        example: exemple,
      }),
    );
  }

  return applyDecorators(...decorators);
}
