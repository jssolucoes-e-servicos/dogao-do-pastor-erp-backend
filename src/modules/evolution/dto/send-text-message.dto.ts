import { StringValidator } from 'src/common/validators';

export class SendTextMessageDTO {
  @StringValidator({ fieldName: 'number', label: 'Número', minLength: 10 })
  number: string;

  @StringValidator({ fieldName: 'message', label: 'Texto' })
  message: string;
}
