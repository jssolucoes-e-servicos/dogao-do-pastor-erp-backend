import { MongoIdValidator } from '@/common/validators';
import { PartialType } from '@nestjs/swagger';
import { CellsCreateDTO } from './cells.create.dto';

export class CellsUpdateDto extends PartialType(CellsCreateDTO) {
  @MongoIdValidator({ fieldName: 'id', label: 'ID' })
  id: string;
}
