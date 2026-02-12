import { CuidValidator } from 'src/common/validators';

export class CreateDeliveryPersonDto {
  @CuidValidator({
    fieldName: 'contributorId',
    label: 'ID do (a) Colaborador(a)',
  })
  contributorId: string;
}
