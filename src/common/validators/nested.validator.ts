// src/common/validators/nested.validator.ts
import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { NestedValidatorType } from 'src/common/types';

export function NestedValidator({
  fieldName,
  label,
  optional = false,
  description,
  dto,
}: NestedValidatorType) {
  const fieldLabel = label || fieldName;
  return applyDecorators(
    IsArray({ message: `Campo ${fieldLabel} deve ser uma lista` }),
    IsNotEmpty({ message: `Campo ${fieldLabel} não pode estar vazio` }),
    ValidateNested({ each: true }),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    Type(() => dto),
    ApiProperty({
      name: fieldName,
      description: description || fieldLabel,
      type: [dto],
    }),
  );
}
