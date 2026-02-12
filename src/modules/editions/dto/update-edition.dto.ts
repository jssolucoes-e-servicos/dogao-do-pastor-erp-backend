import { PartialType } from '@nestjs/swagger';
import { BooleanValidator } from 'src/common/validators';
import { CreateEditionDto } from './create-edition.dto';

export class UpdateEditionDto extends PartialType(CreateEditionDto) {
  @BooleanValidator({
    fieldName: 'active',
    optional: true,
  })
  active?: boolean;
}
