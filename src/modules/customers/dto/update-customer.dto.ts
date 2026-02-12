import { PartialType } from '@nestjs/swagger';
import { BooleanValidator } from 'src/common/validators';
import { CreateCustomerDto } from './create-customer.dto';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
  @BooleanValidator({
    fieldName: 'active',
    optional: true,
  })
  active?: boolean;

  @BooleanValidator({
    fieldName: 'firstRegister',
    optional: true,
  })
  firstRegister?: boolean;
}
