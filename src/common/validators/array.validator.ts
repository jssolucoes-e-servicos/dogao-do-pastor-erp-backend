/* eslint-disable @typescript-eslint/no-unsafe-call */
// src/common/validators/array.validator.ts
import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ArrayValidatorType } from 'src/common/types';

export function ArrayValidator({
  fieldName,
  label,
  optional = false,
  description,
  exemple = [],
}: ArrayValidatorType) {
  const fieldLabel = label || fieldName;
  const fieldDesc = description || fieldLabel;
  const decorators: any[] = [
    IsArray({ message: `Campo ${fieldLabel} deve ser um array` }),
  ];

  // Adiciona a validação baseada no tipo do item (each: true é a chave)
  if (!exemple || typeof (exemple as any)[0] === 'number') {
    decorators.push(
      IsNumber(
        {},
        { 
        each: true,
        message: `Os itens de ${fieldLabel} devem ser números`,
      }),
    );
  } else {
    decorators.push(IsString({ each: true, message: `Os itens de ${fieldLabel} devem ser strings` }));
  }

  if (optional) {
    decorators.push(IsOptional(), ApiPropertyOptional({ name: fieldName, description: fieldDesc, example: exemple }));
  } else {
    decorators.push(IsNotEmpty({ message: `Campo ${fieldLabel} é requerido` }), ApiProperty({ name: fieldName, description: fieldDesc, example: exemple }));
  }

  return applyDecorators(...decorators);
}