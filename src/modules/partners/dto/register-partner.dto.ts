import { CepValidator, StringValidator } from 'src/common/validators';

export class RegisterPartnerDto {
  @StringValidator({
    fieldName: 'name',
    label: 'Nome da instituição',
  })
  name: string;

  @StringValidator({
    fieldName: 'cnpj',
    label: 'CNPJ',
  })
  cnpj: string;

  @StringValidator({
    fieldName: 'phone',
    label: 'Telefone da instituição',
    optional: true,
  })
  phone?: string;

  @StringValidator({
    fieldName: 'description',
    label: 'Descrição',
    optional: true,
  })
  description?: string;

  @CepValidator({
    fieldName: 'zipCode',
    label: 'CEP',
  })
  zipCode: string;

  @StringValidator({
    fieldName: 'street',
    label: 'Logradouro',
  })
  street: string;

  @StringValidator({
    fieldName: 'number',
    label: 'Número',
  })
  number: string;

  @StringValidator({
    fieldName: 'complement',
    label: 'Complemento',
    optional: true,
  })
  complement?: string;

  @StringValidator({
    fieldName: 'neighborhood',
    label: 'Bairro',
  })
  neighborhood: string;

  @StringValidator({
    fieldName: 'city',
    label: 'Município',
  })
  city: string;

  @StringValidator({
    fieldName: 'state',
    label: 'UF',
  })
  state: string;

  @StringValidator({
    fieldName: 'responsibleName',
    label: 'Nome do responsável',
  })
  responsibleName: string;

  @StringValidator({
    fieldName: 'responsiblePhone',
    label: 'Whatsapp do responsável',
  })
  responsiblePhone: string;

  @StringValidator({
    fieldName: 'password',
    label: 'Senha',
    minLength: 6,
  })
  password: string;

  @StringValidator({
    fieldName: 'addressInLine',
    label: 'Endereço em linha',
  })
  addressInLine: string;
}
