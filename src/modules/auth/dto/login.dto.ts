import { StringValidator } from 'src/common/validators';

export class LoginDto {
  @StringValidator({
    fieldName: 'username',
    label: 'Nome de Usuário',
  })
  username: string;

  @StringValidator({
    fieldName: 'password',
    label: 'Senha',
  })
  password: string;
}
