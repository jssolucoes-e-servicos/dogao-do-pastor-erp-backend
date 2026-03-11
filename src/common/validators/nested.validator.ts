// src/common/validators/nested.validator.ts
import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { NestedValidatorType } from 'src/common/types';

export function NestedValidator({
  fieldName,
  label,
  optional = false,
  description,
  isArray = false,
  dto,
}: NestedValidatorType) {
  const fieldLabel = label || fieldName;
  const decorators = [
    optional ? IsOptional() : IsNotEmpty({ message: `Campo ${fieldLabel} não pode estar vazio` }),
    ValidateNested({ each: isArray }),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    Type(() => dto),
    ApiProperty({
      name: fieldName,
      description: description || fieldLabel,
      type: isArray ? [dto] : dto,
      required: !optional,
    }),
  ];

  if (isArray) {
    decorators.push(IsArray({ message: `Campo ${fieldLabel} deve ser uma lista` }));
  } else {
    decorators.push(IsObject({ message: `Campo ${fieldLabel} deve ser um objeto` }));
  }

  return applyDecorators(...decorators);
}
