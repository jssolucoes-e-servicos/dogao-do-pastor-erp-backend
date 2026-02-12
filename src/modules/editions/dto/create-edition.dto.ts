import {
  DateValidator,
  FloatValidator,
  NumberValidator,
  StringValidator
} from 'src/common/validators';

export class CreateEditionDto {
  @StringValidator({
    fieldName: 'name',
    label: 'Nome da edição',
    minLength: 3,
  })
  name: string;

  @DateValidator({
    fieldName: 'productionDate',
    label: 'Data de produção',
  })
  productionDate: Date;

  @DateValidator({
    fieldName: 'saleStartDate',
    label: 'Início das vendas',
  })
  saleStartDate: Date;

  @DateValidator({
    fieldName: 'saleEndDate',
    label: 'Fim das vendas',
  })
  saleEndDate: Date;

  @DateValidator({
    fieldName: 'autoEnableDate',
    optional: true,
  })
  autoEnableDate?: Date;

  @DateValidator({
    fieldName: 'autoDisableDate',
    optional: true,
  })
  autoDisableDate?: Date;

  @NumberValidator({
    fieldName: 'limitSale',
    label: 'Limite de vendas',
    min: 1,
  })
  limitSale: number;

  @FloatValidator({
    fieldName: 'dogPrice',
    label: 'Preço do dog',
    optional: true,
  })
  dogPrice?: number;
}
