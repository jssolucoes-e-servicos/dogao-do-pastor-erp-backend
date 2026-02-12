import { PartialType } from '@nestjs/swagger';
import { BooleanValidator } from 'src/common/validators';
import { CreateContributorDto } from './create-contributor.dto';

export class UpdateContributorDto extends PartialType(CreateContributorDto) {
  @BooleanValidator({
    fieldName: 'active',
    optional: true,
  })
  active?: boolean;
}
