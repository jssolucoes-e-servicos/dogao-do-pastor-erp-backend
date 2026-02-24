// src/modules/auth/dto/otp-request.dto.ts
import { UserTypesEnum } from 'src/common/enums';
import { StringValidator } from 'src/common/validators';

export class OtpRequestDto {
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
}
