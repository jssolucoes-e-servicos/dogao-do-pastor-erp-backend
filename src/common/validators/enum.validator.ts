// src/common/validators/enum.validator.ts

import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { EnumValidatorType } from 'src/common/types';

export function EnumValidator<T extends object>({
  fieldName,
  label,
  enumType,
  optional = false,
  description,
  exemple,
}: EnumValidatorType<T>) {
  if (label === undefined) label = fieldName;

  if (optional === true) {
    return applyDecorators(
      IsEnum(enumType, {
        message: `Campo ${label} possui valor inválido`,
      }),
      IsOptional(),
      ApiPropertyOptional({
        name: fieldName,
        enum: enumType,
        description,
        example: exemple,
      }),
    );
  }

  return applyDecorators(
    IsEnum(enumType, {
      message: `Campo ${label} possui valor inválido`,
    }),
    IsNotEmpty({
      message: `Campo ${label} é requerido`,
    }),
    ApiProperty({
      name: fieldName,
      enum: enumType,
      description,
      example: exemple,
    }),
  );
}
