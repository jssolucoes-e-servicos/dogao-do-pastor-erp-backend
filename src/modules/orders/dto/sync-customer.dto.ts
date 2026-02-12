import { StringValidator } from 'src/common/validators';

export class SyncCustomerDTO {
  @StringValidator({
    fieldName: 'name',
    label: 'Nome do Cliente',
  })
  name: string;

  @StringValidator({
    fieldName: 'phone',
    label: 'Whatsapp do Cliente',
  })
  phone: string;
}
