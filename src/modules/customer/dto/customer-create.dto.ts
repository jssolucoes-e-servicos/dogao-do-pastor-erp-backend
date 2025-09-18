import {
  BooleanValidator,
  EmailValidator,
  StringValidator,
} from '@/common/validators';

export class CustomerCreateDTO {
  @StringValidator({ fieldName: 'name', label: 'Nome' })
  name: string;

  @EmailValidator({ fieldName: 'email', label: 'Email' })
  email: string;

  @StringValidator({ fieldName: 'phone', label: 'Telefone', minLength: 10 })
  phone: string;

  @StringValidator({ fieldName: 'phone', label: 'CPF', minLength: 11 })
  cpf: string;

  @BooleanValidator({ fieldName: 'knowsChurch', label: 'Conhece a IVC?' })
  knowsChurch?: boolean;

  @BooleanValidator({ fieldName: 'knowsChurch', label: 'Conhece a IVC?' })
  allowsChurch?: boolean;
}
