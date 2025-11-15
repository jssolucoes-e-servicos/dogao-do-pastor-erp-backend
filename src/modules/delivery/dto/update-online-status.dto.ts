import { BooleanValidator, MongoIdValidator } from '@/common/validators';

export class UpdateOnlineStatusDto {
  @MongoIdValidator({
    fieldName: 'deliveryPersonId',
    label: 'ID do Entregador',
  })
  deliveryPersonId: string;

  @BooleanValidator({ fieldName: 'online', label: 'Online' })
  online: boolean;

  @BooleanValidator({ fieldName: 'online', label: 'Online', optional: true })
  inRoute?: boolean;
}
