import { StringValidator } from '@/common/validators';

export class OnlyCPFRequestDTO {
  @StringValidator({ fieldName: 'cpf', label: 'cpf', minLength: 11 })
  cpf: string;
}
