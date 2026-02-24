// src/modules/auth/dto/change-password.dto.ts
import { UserTypesEnum } from 'src/common/enums';
import { StringValidator } from 'src/common/validators';

export class ChangePasswordDto {
  @StringValidator({
    fieldName: 'userId',
    label: 'ID so usuário',
  })
  userId: string;

  @StringValidator({
    fieldName: 'type',
    label: 'Tipo de usuário',
  })
  type: UserTypesEnum;

  @StringValidator({
    fieldName: 'token',
    label: 'Token de confirmação',
  })
  token: string;

  @StringValidator({
    fieldName: 'password',
    label: 'Senha nova',
  })
  password: string;
}
