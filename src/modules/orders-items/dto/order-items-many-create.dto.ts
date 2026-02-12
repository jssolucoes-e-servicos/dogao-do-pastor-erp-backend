import { NestedValidator, NumberValidator, StringValidator } from 'src/common/validators';
import { ArrayValidator } from 'src/common/validators/array.validator';

class OrderItemDTO {
  @NumberValidator({
    fieldName: 'id',
    label: 'Sequência do item',
  })
  id: number;

  @ArrayValidator({
    fieldName: 'removedIngredients',
    label: 'Ingredientes removidos',
    optional: true,
    exemple: ['Cebola', 'Ervilha'],
  })
  removedIngredients?: string[];
}

export class OrderItemsManyCreateDTO {
  @StringValidator({
    fieldName: 'orderId ',
    label: 'ID do pedido',
  })
  orderId: string;

  @NestedValidator({
    fieldName: 'orderItems',
    label: 'Itens',
    dto: OrderItemDTO,
  })
  orderItems: OrderItemDTO[];
}
