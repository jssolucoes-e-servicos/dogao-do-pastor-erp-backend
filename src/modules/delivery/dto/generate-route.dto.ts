import { MongoIdValidator, StringValidator } from '@/common/validators';

export class GenerateRouteDto {
  @StringValidator({ fieldName: 'orderIds', label: 'Lista de Pedidos' })
  orderIds: string[];

  @MongoIdValidator({
    fieldName: 'deliveryPersonId',
    label: 'ID do entregador',
  })
  deliveryPersonId: string;
}
