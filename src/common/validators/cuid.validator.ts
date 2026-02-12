// src/common/validators/cuid.validator.ts

import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { CuidValidatorType } from 'src/common/types';

export function CuidValidator({
  fieldName,
  label,
  optional = false,
  description,
  exemple,
}: CuidValidatorType) {
  if (label === undefined) label = fieldName;

  const cuidRegex = /^c[a-z0-9]{24,}$/i;

  if (optional === true) {
    return applyDecorators(
      Matches(cuidRegex, {
        message: `Campo ${label} deve ser um CUID válido`,
      }),
      IsOptional(),
      ApiPropertyOptional({
        name: fieldName,
        description,
        example: exemple,
      }),
    );
  }

  return applyDecorators(
    Matches(cuidRegex, {
      message: `Campo ${label} deve ser um CUID válido`,
    }),
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
