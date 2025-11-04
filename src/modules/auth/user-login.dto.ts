import { StringValidator } from '@/common/validators';

export class UserLoginDto {
  @StringValidator({ fieldName: 'username', label: 'Username' })
  username: string;

  @StringValidator({ fieldName: 'password', label: 'Senha' })
  password: string;
}
