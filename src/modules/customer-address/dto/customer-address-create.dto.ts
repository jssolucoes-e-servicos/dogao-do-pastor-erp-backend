import { MongoIdValidator, StringValidator } from '@/common/validators';

export class CustomerAddressCreateDTO {
  @MongoIdValidator({ fieldName: 'customerId', label: 'ID do clinte' })
  customerId: string;
  @StringValidator({ fieldName: 'street', label: 'Logradouro' })
  street: string;
  @StringValidator({ fieldName: 'number', label: 'Número' })
  number: string;
  @StringValidator({ fieldName: 'neighborhood', label: 'Bairro' })
  neighborhood: string;
  @StringValidator({ fieldName: 'city', label: 'Municipio' })
  city: string;
  @StringValidator({ fieldName: 'state', label: 'UF' })
  state: string;
  @StringValidator({ fieldName: 'zipCode', label: 'CEP' })
  zipCode: string;
  @StringValidator({
    fieldName: 'complement',
    label: 'Complemento',
    optional: true,
  })
  complement?: string;
}
