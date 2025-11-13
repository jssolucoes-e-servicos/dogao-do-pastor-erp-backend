import { StringValidator } from '@/common/validators';

export class LoginDto {
  @StringValidator({ fieldName: 'username', label: 'Username' })
  username: string;

  @StringValidator({ fieldName: 'password', label: 'Senha' })
  password: string;
}
