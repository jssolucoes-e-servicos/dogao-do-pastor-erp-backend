import { PartialType } from '@nestjs/swagger';
import { BooleanValidator } from 'src/common/validators';
import { CreatePaymentDTO } from './create-payment.dto';

export class UpdatePaymentDTO extends PartialType(CreatePaymentDTO) {
  @BooleanValidator({
    fieldName: 'active',
    optional: true,
  })
  active?: boolean;
}
