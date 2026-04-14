import { IsOptional, IsString } from 'class-validator';
import { StringValidator } from 'src/common/validators';

export class InitOrderDto {
  @StringValidator({
    fieldName: 'cpf',
    label: 'CPF',
  })
  cpf: string;

  @StringValidator({
    fieldName: 'sellerTag',
    label: 'TAG do vendedor',
  })
  sellerTag: string;

  @IsOptional()
  @IsString()
  contributorId?: string; // preenchido pelo app quando o membro vende
}
