import { StringValidator } from '@/common/validators';

export class BySellerTagDTO {
  @StringValidator({ fieldName: 'tag', label: 'Tag' })
  tag: string;
}
