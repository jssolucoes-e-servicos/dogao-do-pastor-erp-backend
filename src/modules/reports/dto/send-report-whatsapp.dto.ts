import { PhoneValidator } from '@/common/validators';

export class SendReportWhastappDTO {
  @PhoneValidator({ fieldName: 'phone', label: 'Telefone' })
  phone: string;
}
