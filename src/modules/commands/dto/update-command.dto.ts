import {
  BooleanValidator,
  EnumValidator,
  StringValidator,
} from 'src/common/validators';
import { CommandStatusEnum } from 'src/common/enums';

export class UpdateCommandDto {
  @EnumValidator({
    fieldName: 'status',
    label: 'Status',
    enumType: CommandStatusEnum,
    optional: true,
  })
  status?: CommandStatusEnum;

  @BooleanValidator({
    fieldName: 'printed',
    label: 'Impresso',
    optional: true,
  })
  printed?: boolean;

  @BooleanValidator({
    fieldName: 'sentWhatsApp',
    label: 'WhatsApp Enviado',
    optional: true,
  })
  sentWhatsApp?: boolean;

  @StringValidator({
    fieldName: 'pdfUrl',
    label: 'URL do PDF',
    optional: true,
  })
  pdfUrl?: string;
}
