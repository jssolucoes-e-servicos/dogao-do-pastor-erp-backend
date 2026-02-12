import { CuidValidator, StringValidator } from 'src/common/validators';

export class CreateCustomerAddressDto {
  @CuidValidator({
    fieldName: 'customerId',
    label: 'ID do Cliente',
  })
  customerId: string;

  @StringValidator({
    fieldName: 'name',
    label: 'Nome',
  })
  street: string;

  @StringValidator({
    fieldName: 'number',
    label: 'Número',
  })
  number: string;

  @StringValidator({
    fieldName: 'neighborhood',
    label: 'Bairro',
  })
  neighborhood: string;

  @StringValidator({
    fieldName: 'city',
    label: 'Munícipio',
  })
  city: string;

  @StringValidator({
    fieldName: 'state',
    label: 'UF',
  })
  state: string;

  @StringValidator({
    fieldName: 'zipCode',
    label: 'CEP',
  })
  zipCode: string;

  @StringValidator({
    fieldName: 'complement',
    label: 'Complemento',
    optional: true,
  })
  complement?: string | null;
}
