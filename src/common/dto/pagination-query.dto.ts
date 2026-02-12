import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Página atual',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Itens por página',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perPage: number = 10;

  @ApiPropertyOptional({
    example: 'joao',
    description: 'Texto para busca (nome, telefone, cpf, etc)',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
