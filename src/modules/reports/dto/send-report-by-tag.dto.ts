import { PhoneValidator, StringValidator } from '@/common/validators';

export class SendReportByTagDTO {
  @PhoneValidator({ fieldName: 'phone', label: 'Telefone' })
  phone: string;

  @StringValidator({ fieldName: 'tag', label: 'Tag' })
  tag: string;
}
