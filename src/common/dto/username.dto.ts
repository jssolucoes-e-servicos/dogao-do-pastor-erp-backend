import { StringValidator } from 'src/common/validators';

export class UsernameParamDto {
  @StringValidator({
    fieldName: 'username',
    label: 'Usuario',
  })
  username: string;
}
