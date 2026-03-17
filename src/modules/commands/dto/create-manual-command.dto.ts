import {
  ArrayValidator,
  EnumValidator,
  NestedValidator,
  StringValidator,
} from 'src/common/validators';
import { DeliveryOptionEnum } from 'src/common/enums';

export class ManualCommandItemDto {
  @ArrayValidator({
    fieldName: 'removedIngredients',
    label: 'Ingredientes Removidos',
    optional: true,
    exemple: ['Cebola', 'Tomate'],
  })
  removedIngredients?: string[];
}

export class ManualCommandAddressDto {
  @StringValidator({
    fieldName: 'id',
    label: 'ID do Endereço',
    optional: true,
  })
  id?: string;

  @StringValidator({ fieldName: 'street', label: 'Rua' })
  street: string;

  @StringValidator({ fieldName: 'number', label: 'Número' })
  number: string;

  @StringValidator({ fieldName: 'neighborhood', label: 'Bairro' })
  neighborhood: string;

  @StringValidator({ fieldName: 'city', label: 'Cidade' })
  city: string;

  @StringValidator({ fieldName: 'state', label: 'Estado' })
  state: string;

  @StringValidator({ fieldName: 'zipCode', label: 'CEP' })
  zipCode: string;

  @StringValidator({
    fieldName: 'complement',
    label: 'Complemento',
    optional: true,
  })
  complement?: string;
}

export class CreateManualCommandDto {
  @StringValidator({ fieldName: 'customerName', label: 'Nome do Cliente' })
  customerName: string;

  @StringValidator({ fieldName: 'cpf', label: 'CPF', optional: true })
  cpf?: string;

  @StringValidator({ fieldName: 'phone', label: 'Telefone' })
  phone: string;

  @EnumValidator({
    fieldName: 'deliveryOption',
    label: 'Modalidade de Entrega',
    enumType: DeliveryOptionEnum,
  })
  deliveryOption: DeliveryOptionEnum;

  @StringValidator({
    fieldName: 'scheduledTime',
    label: 'Horário Agendado',
    optional: true,
  })
  scheduledTime?: string;

  @StringValidator({
    fieldName: 'sellerId',
    label: 'ID do Vendedor',
    optional: true,
  })
  sellerId?: string;

  @StringValidator({
    fieldName: 'sellerTag',
    label: 'TAG do Vendedor',
    optional: true,
  })
  sellerTag?: string;

  @StringValidator({
    fieldName: 'observation',
    label: 'Observações',
    optional: true,
  })
  observation?: string;

  @NestedValidator({
    fieldName: 'address',
    label: 'Endereço',
    dto: ManualCommandAddressDto,
    optional: true,
  })
  address?: ManualCommandAddressDto;

  @NestedValidator({
    fieldName: 'items',
    label: 'Itens',
    dto: ManualCommandItemDto,
    isArray: true,
  })
  items: ManualCommandItemDto[];
}
