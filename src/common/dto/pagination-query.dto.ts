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
    description: 'Texto para busca (nome, telefone, cpf, etc)',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'CPF para busca específica',
  })
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiPropertyOptional({
    description: 'Telefone para busca específica',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Status para filtragem',
  })
  @IsOptional()
  @IsString({ each: true })
  status?: string | string[];

  @ApiPropertyOptional({
    description: 'Opção de entrega para filtragem',
  })
  @IsOptional()
  @IsString()
  deliveryOption?: string;

  @ApiPropertyOptional({
    description: 'Status de pagamento para filtragem',
  })
  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por existência de comanda',
  })
  @IsOptional()
  @IsString()
  hasCommand?: 'true' | 'false';

  @ApiPropertyOptional({
    description: 'Filtrar por status da comanda',
  })
  @IsOptional()
  @IsString()
  commandStatus?: string;

  @ApiPropertyOptional({
    description: 'Incluir doações já vinculadas a parceiros',
  })
  @IsOptional()
  @IsString()
  includeAssigned?: 'true' | 'false';
}
