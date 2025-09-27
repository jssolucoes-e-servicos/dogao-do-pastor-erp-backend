import { StringValidator } from 'src/common/validators';

export class SellerFindByTagDTO {
  @StringValidator({
    fieldName: 'tag',
    label: 'TAG',
  })
  tag: string;
}
