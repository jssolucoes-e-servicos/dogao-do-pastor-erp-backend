import { PartialType } from '@nestjs/swagger';
import { BooleanValidator, StringValidator } from 'src/common/validators';
import { CreateDeliveryPersonDto } from './create-delivery-person.dto';

export class UpdateDeliveryPersonDto extends PartialType(
  CreateDeliveryPersonDto,
) {
  @BooleanValidator({
    fieldName: 'online',
    optional: true,
  })
  online?: boolean;

  @BooleanValidator({
    fieldName: 'online',
    optional: true,
  })
  inRoute?: boolean;

  @StringValidator({
    fieldName: 'pushSubscription',
    label: 'pushSubscription',
    optional: true,
  })
  pushSubscription?: string;

  @BooleanValidator({
    fieldName: 'active',
    optional: true,
  })
  active?: boolean;
}
