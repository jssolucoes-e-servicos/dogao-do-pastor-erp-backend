import {
  MongoIdValidator,
  PhoneValidator,
  StringValidator,
} from 'src/common/validators';

export class SellerCreateDTO {
  @MongoIdValidator({
    fieldName: 'cellId',
    label: 'ID da Célula',
    exemple: '68d5d85fd3155cc4cec4ee47',
  })
  cellId: string;

  @StringValidator({ fieldName: 'name', label: 'Nome' })
  name: string;

  @PhoneValidator({ fieldName: 'phone', label: 'Telefone' })
  phone: string;

  @StringValidator({ fieldName: 'tag', label: 'Tag' })
  tag: string;
}
