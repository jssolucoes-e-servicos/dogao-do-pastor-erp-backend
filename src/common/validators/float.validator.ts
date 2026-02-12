// src/common/validators/float.validator.ts

import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { FloatValidatorType } from 'src/common/types';

export function FloatValidator({
  fieldName,
  label,
  optional = false,
  description,
  exemple,
}: FloatValidatorType) {
  if (label === undefined) label = fieldName;

  if (optional === true) {
    return applyDecorators(
      IsNumber(
        { allowNaN: false, allowInfinity: false },
        { message: `Campo ${label} em formato inválido` },
      ),
      IsOptional(),
      ApiPropertyOptional({
        name: fieldName,
        description,
        example: exemple,
      }),
    );
  }

  return applyDecorators(
    IsNumber(
      { allowNaN: false, allowInfinity: false },
      { message: `Campo ${label} em formato inválido` },
    ),
    IsNotEmpty({
      message: `Campo ${label} é requerido`,
    }),
    ApiProperty({
      name: fieldName,
      description,
      example: exemple,
    }),
  );
}
