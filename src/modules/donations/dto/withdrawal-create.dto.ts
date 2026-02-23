// src/modules/donations/dto/withdrawal-create.dto.ts
import { NestedValidator, StringValidator, DateValidator } from 'src/common/validators';
import { ArrayValidator } from 'src/common/validators/array.validator';
import { NumberValidator } from 'src/common/validators/number.validator';

class WithdrawalItemDTO {
  @NumberValidator({
    fieldName: 'quantity',
    label: 'Quantidade',
    min: 1,
  })
  quantity: number;

  @ArrayValidator({
    fieldName: 'removedIngredients',
    label: 'Ingredientes removidos',
    optional: true,
    exemple: ['Cebola', 'Picles'],
  })
  removedIngredients?: string[];
}

export class WithdrawalCreateDTO {
  @StringValidator({
    fieldName: 'partnerId',
    label: 'ID do Parceiro',
  })
  partnerId: string;

  @DateValidator({
    fieldName: 'scheduledAt',
    label: 'Data e Hora da Retirada',
  })
  scheduledAt: Date;

  @NestedValidator({
    fieldName: 'items',
    label: 'Itens da Retirada',
    dto: WithdrawalItemDTO,
  })
  items: WithdrawalItemDTO[];
}