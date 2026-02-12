import { PhoneValidator, StringValidator } from 'src/common/validators';

export class CreateContributorDto {
  @StringValidator({
    fieldName: 'name',
    label: 'Nome',
    minLength: 3,
  })
  name: string;

  @PhoneValidator({
    fieldName: 'phone',
    label: 'Telefone (Whatsapp)',
    optional: true,
  })
  phone?: string;

  @StringValidator({
    fieldName: 'photo',
    label: 'URL da foto',
    optional: true,
  })
  photo?: string;

  @StringValidator({
    fieldName: 'username',
    label: 'Usuário',
    optional: true,
  })
  username?: string;
}
