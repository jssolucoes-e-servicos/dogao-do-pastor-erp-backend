import { PartialType } from '@nestjs/mapped-types';
import { BooleanValidator, StringValidator } from 'src/common/validators';
import { RegisterPartnerDto } from './register-partner.dto';

export class UpdatePartnerDto extends PartialType(RegisterPartnerDto) {
  @StringValidator({
    fieldName: 'logo',
    label: 'Logo da instituição',
    optional: true,
  })
  logo?: string;

  @BooleanValidator({
    fieldName: 'active',
    label: 'Ativo?',
    optional: true,
  })
  active?: boolean;

  @BooleanValidator({
    fieldName: 'approved',
    label: 'Aprovado?',
    optional: true,
  })
  approved?: boolean;
}
