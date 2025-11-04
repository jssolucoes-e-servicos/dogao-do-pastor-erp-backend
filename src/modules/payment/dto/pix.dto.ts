import { MongoIdValidator } from '@/common/validators';

export class PixDTO {
  @MongoIdValidator({
    fieldName: 'preorderId',
    label: 'ID do Pedido',
    optional: true,
  })
  preorderId?: string;
}
