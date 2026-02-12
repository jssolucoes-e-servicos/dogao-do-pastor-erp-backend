import { PartialType } from '@nestjs/swagger';
import { BooleanValidator } from 'src/common/validators';
import { CreateCellDto } from './create-cell.dto';

export class UpdateCellDto extends PartialType(CreateCellDto) {
  @BooleanValidator({
    fieldName: 'active',
    optional: true,
  })
  active?: boolean;
}
