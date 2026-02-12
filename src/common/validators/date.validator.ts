// src/common/validators/date.validator.ts

import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional } from 'class-validator';
import { DateValidatorType } from 'src/common/types';

export function DateValidator({
  fieldName,
  label,
  optional = false,
  description,
  exemple,
}: DateValidatorType) {
  if (label === undefined) label = fieldName;

  if (optional === true) {
    return applyDecorators(
      Type(() => Date),
      IsDate({
        message: `Campo ${label} deve ser uma data válida`,
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
    Type(() => Date),
    IsDate({
      message: `Campo ${label} deve ser uma data válida`,
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
