import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMobilePhone, IsNotEmpty, IsOptional } from 'class-validator';
import { IPhoneValidator } from 'src/common/interfaces';

export function PhoneValidator({ fieldName, label, optional = false, description, exemple = '' }: IPhoneValidator) {
  if (label === undefined) label = fieldName;

  if (optional === true) {
    return applyDecorators(
      IsMobilePhone(
        'pt-BR',
        {},
        {
          message: `Campo ${label} em formáto inválido`,
        },
      ),
      IsOptional(),
      ApiPropertyOptional({
        name: fieldName,
        description: description,
        example: exemple,
      }),
    );
  }
  return applyDecorators(
    IsMobilePhone(
      'pt-BR',
      {},
      {
        message: `Campo ${label} em formáto inválido`,
      },
    ),
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
