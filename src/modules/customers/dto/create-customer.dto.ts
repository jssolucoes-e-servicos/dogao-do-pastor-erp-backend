import {
  BooleanValidator,
  EmailValidator,
  PhoneValidator,
  StringValidator,
} from 'src/common/validators';

export class CreateCustomerDto {
  @StringValidator({
    fieldName: 'name',
    label: 'Nome',
  })
  name: string;

  @EmailValidator({
    fieldName: 'email',
    label: 'Email',
  })
  email?: string | null;

  @PhoneValidator({
    fieldName: 'phone',
    label: 'Phone',
  })
  phone: string;

  @StringValidator({
    fieldName: 'cpf',
    label: 'CPF',
  })
  cpf?: string | null;

  @BooleanValidator({
    fieldName: 'knowsChurch',
    label: 'Conhece a IVC?',
  })
  knowsChurch: boolean;

  @BooleanValidator({
    fieldName: 'allowsChurch',
    label: 'Receber mensagens da IVC?',
  })
  allowsChurch: boolean;
}
