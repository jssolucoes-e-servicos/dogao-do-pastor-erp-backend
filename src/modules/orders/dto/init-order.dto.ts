import { StringValidator } from 'src/common/validators';

export class InitOrderDto {
  @StringValidator({
    fieldName: 'cpf',
    label: 'CPF',
  })
  cpf: string;

  @StringValidator({
    fieldName: 'sellerTag',
    label: 'TAG do venddedor',
  })
  sellerTag: string;
}
