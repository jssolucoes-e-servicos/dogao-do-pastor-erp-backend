import { PartialType } from '@nestjs/swagger';
import { BooleanValidator } from 'src/common/validators';
import { CreateSellerDto } from './create-seller.dto';

export class UpdateSellerDto extends PartialType(CreateSellerDto) {
  @BooleanValidator({
    fieldName: 'active',
    optional: true,
  })
  active?: boolean;
}
