import { MongoIdValidator, StringValidator } from '@/common/validators';
export class PreSaleCreateDTO {
  @MongoIdValidator({ fieldName: 'customerId', label: 'Id do Clinte' })
  customerId: string;
  @MongoIdValidator({
    fieldName: 'deliveryAddressId',
    label: 'ID do endereço (en caso de entrega)',
    optional: true,
  })
  deliveryAddressId?: string | null;
  @StringValidator({ fieldName: 'deliveryOption', label: 'Tipo de Pedido' })
  deliveryOption: string;

  orderItems: PreOrderItemDTO[];
}

class PreOrderItemDTO {
  removedIngredients?: string[];
}
