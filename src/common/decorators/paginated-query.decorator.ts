import { applyDecorators, Get } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

type PaginatedQueryProps = {
  route?: string;
};

export function PaginatedQuery({ route = '' }: PaginatedQueryProps = {}) {
  return applyDecorators(
    Get(route),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      example: 1,
      description: 'Página atual',
    }),
    ApiQuery({
      name: 'perPage',
      required: false,
      type: Number,
      example: 10,
      description: 'Itens por página',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      example: 'joao',
      description: 'Texto para busca (nome, telefone, cpf, etc)',
    }),
  );
}
