import { PartialType } from '@nestjs/swagger';
import { BooleanValidator } from 'src/common/validators';
import { CreateCustomerAddressDto } from './create-customer-address.dto';

export class UpdateCustomerAddressDto extends PartialType(
  CreateCustomerAddressDto,
) {
  @BooleanValidator({
    fieldName: 'active',
    optional: true,
  })
  active?: boolean;
}
