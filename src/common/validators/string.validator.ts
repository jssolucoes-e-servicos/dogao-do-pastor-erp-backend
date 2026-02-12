// src/common/validators/string.validator.ts

import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { StringValidatorType } from 'src/common/types';

export function StringValidator({
  fieldName,
  label,
  minLength = 0,
  optional = false,
  description,
  exemple = '',
}: StringValidatorType) {
  if (label === undefined) label = fieldName;

  if (description === undefined) description = label;

  if (optional === true) {
    // Campo opcional
    return applyDecorators(
      IsString({
        message: `Campo ${label} em formato inválido`,
      }),
      MinLength(minLength, {
        message: `Campo ${label} com caracteres insuficientes, o mínimo é ${minLength}`,
      }),
      IsOptional(),
      ApiPropertyOptional({
        name: fieldName,
        description: description,
        example: exemple,
      }),
    );
  }

  // Campo obrigatório
  return applyDecorators(
    IsString({
      message: `Campo ${label} em formato inválido`,
    }),
    MinLength(minLength, {
      message: `Campo ${label} com caracteres insuficientes, o mínimo é ${minLength}`,
    }),
    IsNotEmpty({
      message: `Campo ${label} é requerido`,
    }),
    ApiProperty({
      name: fieldName,
      description: description,
      example: exemple,
    }),
  );
}
