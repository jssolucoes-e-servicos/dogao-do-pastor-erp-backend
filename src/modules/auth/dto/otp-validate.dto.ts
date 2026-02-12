import { StringValidator } from 'src/common/validators';

export class OtpValidateDto {
  @StringValidator({
    fieldName: 'userId',
    label: 'ID so usuário',
  })
  userId: string;

  @StringValidator({
    fieldName: 'code',
    label: 'Código OTP',
  })
  code: string;
}
