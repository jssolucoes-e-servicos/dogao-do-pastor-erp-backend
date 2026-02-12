import { StringValidator } from 'src/common/validators';

export class IdParamDto {
  @StringValidator({
    fieldName: 'id',
    label: 'ID do registro',
  })
  id: string;
}
