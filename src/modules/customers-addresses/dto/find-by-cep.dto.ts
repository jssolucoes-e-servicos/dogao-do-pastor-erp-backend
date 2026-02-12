import { StringValidator } from 'src/common/validators';

export class FindByCepDto {
  @StringValidator({
    fieldName: 'zipCode',
    label: 'CEP',
  })
  zipCode: string;
}
