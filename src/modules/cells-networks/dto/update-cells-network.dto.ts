import { PartialType } from '@nestjs/swagger';
import { BooleanValidator } from 'src/common/validators';
import { CreateCellsNetworkDto } from './create-cells-network.dto';

export class UpdateCellsNetworkDto extends PartialType(CreateCellsNetworkDto) {
  @BooleanValidator({
    fieldName: 'active',
    optional: true,
  })
  active?: boolean;
}
