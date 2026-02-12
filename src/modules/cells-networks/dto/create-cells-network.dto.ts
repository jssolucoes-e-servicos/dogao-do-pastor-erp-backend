import {
  CuidValidator,
  PhoneValidator,
  StringValidator,
} from 'src/common/validators';

export class CreateCellsNetworkDto {
  @StringValidator({
    fieldName: 'name',
    label: 'Nome',
    minLength: 3,
  })
  name: string;

  @CuidValidator({
    fieldName: 'supervisorId',
    label: 'ID do supervisor',
  })
  supervisorId: string;

  @PhoneValidator({
    fieldName: 'phone',
    label: 'Telefone (Whatsapp)',
    optional: true,
  })
  phone: string;
}
