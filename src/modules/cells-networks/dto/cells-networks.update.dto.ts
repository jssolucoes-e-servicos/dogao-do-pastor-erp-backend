import { MongoIdValidator } from '@/common/validators';
import { PartialType } from '@nestjs/swagger';
import { CellsNetworksCreateDTO } from './cells-networks.create.dto';

export class CellsNetworksUpdateDto extends PartialType(
  CellsNetworksCreateDTO,
) {
  @MongoIdValidator({ fieldName: 'id', label: 'ID' })
  id: string;
}
