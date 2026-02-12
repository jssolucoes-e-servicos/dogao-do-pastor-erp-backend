import { StringValidator } from 'src/common/validators';

export class ParamTagSellerDto {
  @StringValidator({
    fieldName: 'tag',
    label: 'TAG',
  })
  tag: string;
}
