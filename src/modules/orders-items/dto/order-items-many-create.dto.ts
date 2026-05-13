import { BooleanValidator, NestedValidator, NumberValidator, StringValidator } from 'src/common/validators';
import { ArrayValidator } from 'src/common/validators/array.validator';

class OrderItemDTO {
  @NumberValidator({
    fieldName: 'id',
    label: 'Sequência do item',
  })
  id: number;

  @BooleanValidator({
    fieldName: 'isPromo',
    label: 'Item Promocional',
    optional: true,
  })
  isPromo?: boolean;

  @ArrayValidator({
    fieldName: 'removedIngredients',
    label: 'Ingredientes removidos',
    optional: true,
    exemple: ['Mostarda', 'Batata Palha'],
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
    isArray: true,
    dto: OrderItemDTO,
  })
  orderItems: OrderItemDTO[];
}
