import { StringValidator } from 'src/common/validators';

export class FindCpfCustomerDto {
  @StringValidator({
    fieldName: 'cpf',
    label: 'CPF',
  })
  cpf: string;
}
