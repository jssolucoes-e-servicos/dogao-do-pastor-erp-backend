import { StringValidator } from 'src/common/validators';

export class CustomerChangePasswordDto {
  @StringValidator({
    fieldName: 'currentPassword',
    label: 'Senha atual',
    minLength: 6,
  })
  currentPassword: string;

  @StringValidator({
    fieldName: 'newPassword',
    label: 'Nova senha',
    minLength: 6,
  })
  newPassword: string;
}
