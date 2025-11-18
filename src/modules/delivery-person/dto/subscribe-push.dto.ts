import { MongoIdValidator, StringValidator } from '@/common/validators';

export class SubscribePushDTO {
  @MongoIdValidator({
    fieldName: 'deliveryPersonId',
    label: 'ID dos Entregador',
  })
  deliveryPersonId: string;

  @StringValidator({
    fieldName: 'subscription',
    label: 'Subscription',
  })
  subscription: string;
}
