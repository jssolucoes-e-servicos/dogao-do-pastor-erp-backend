// src/common/validators/boolean.validator.ts

import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';
import { BooleanValidatorType } from 'src/common/types';

export function BooleanValidator({
  fieldName,
  label,
  optional = false,
  description,
}: BooleanValidatorType) {
  if (label === undefined) label = fieldName;

  if (optional === true) {
    return applyDecorators(
      IsBoolean({
        message: `Campo ${label} em formáto inválido`,
      }),
      IsOptional(),
      ApiPropertyOptional({
        name: fieldName,
        description: description,
      }),
    );
  }

  return applyDecorators(
    IsBoolean({
      message: `Campo ${label} em formáto inválido`,
    }),
    IsNotEmpty({
      message: `Campo ${label} é requirido`,
    }),
    ApiProperty({
      name: label,
      description: description,
    }),
  );
}
