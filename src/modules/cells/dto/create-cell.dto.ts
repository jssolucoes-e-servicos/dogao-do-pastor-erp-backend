import { CuidValidator, StringValidator } from 'src/common/validators';

export class CreateCellDto {
  @StringValidator({
    fieldName: 'name',
    label: 'Nome',
    minLength: 3,
  })
  name: string;

  @CuidValidator({
    fieldName: 'networkId',
    label: 'ID da Rede',
  })
  networkId: string;

  @CuidValidator({
    fieldName: 'leaderId',
    label: 'ID do (a) líder',
  })
  leaderId: string;
}
