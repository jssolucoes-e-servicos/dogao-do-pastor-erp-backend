import { PartialType } from '@nestjs/mapped-types';
import { StringValidator } from 'src/common/validators';
import { RegisterPartnerDto } from './register-partner.dto';

export class UpdatePartnerDto extends PartialType(RegisterPartnerDto) {
  @StringValidator({
    fieldName: 'logo',
    label: 'Logo da instituição',
    optional: true,
  })
  logo?: string;
}
