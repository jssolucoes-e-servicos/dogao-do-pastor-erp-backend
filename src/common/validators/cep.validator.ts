import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsPostalCode } from 'class-validator';
import { ICepValidator } from 'src/common/interfaces';

export function CepValidator({ fieldName, label, optional = false, description, exemple }: ICepValidator) {
  if (label === undefined) label = fieldName;
  if (optional === true) {
    return applyDecorators(
      IsPostalCode('BR', {
        message: `Campo ${label} em formáto inválido`,
      }),
      IsOptional(),
      ApiPropertyOptional({
        name: fieldName,
        description: description,
        example: exemple,
      }),
    );
  }
  return applyDecorators(
    IsPostalCode('BR', {
      message: `Campo ${label} em formáto inválido`,
    }),
    IsNotEmpty({
      message: `Campo ${label} é requirido`,
    }),
    ApiProperty({
      name: fieldName,
      description: description,
      example: exemple,
    }),
  );
}
