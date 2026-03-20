import {
  EnumValidator,
  NestedValidator,
  NumberValidator,
  PhoneValidator,
  StringValidator,
} from 'src/common/validators';
import { DeliveryOptionEnum, PaymentMethodEnum } from 'src/common/enums';
import { Type } from 'class-transformer';
import { ValidateNested, IsOptional, IsString, IsArray } from 'class-validator';

export class PdvOrderItemDto {
  @StringValidator({
    fieldName: 'productId',
    label: 'ID do Produto',
  })
  productId: string;

  @NumberValidator({
    fieldName: 'quantity',
    label: 'Quantidade',
  })
  quantity: number;

  @StringValidator({
    fieldName: 'observations',
    label: 'Observações',
    optional: true,
  })
  observations?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removedIngredients?: string[];
}

export class CreatePdvOrderDto {
  @StringValidator({
    fieldName: 'customerName',
    label: 'Nome do Cliente',
  })
  customerName: string;

  @PhoneValidator({
    fieldName: 'customerPhone',
    label: 'Telefone do Cliente',
  })
  customerPhone: string;

  @StringValidator({
    fieldName: 'customerCpf',
    label: 'CPF do Cliente',
    optional: true,
  })
  customerCpf?: string;

  @EnumValidator({
    fieldName: 'paymentMethod',
    label: 'Método de Pagamento',
    enumType: PaymentMethodEnum,
  })
  paymentMethod: PaymentMethodEnum;

  @EnumValidator({
    fieldName: 'deliveryOption',
    label: 'Opção de Entrega',
    enumType: DeliveryOptionEnum,
    optional: true,
  })
  deliveryOption?: DeliveryOptionEnum;

  @StringValidator({
    fieldName: 'address',
    label: 'Endereço de Entrega',
    optional: true,
  })
  address?: string;

  @StringValidator({
    fieldName: 'scheduledTime',
    label: 'Horário Agendado',
    optional: true,
  })
  scheduledTime?: string;

  @NumberValidator({
    fieldName: 'totalValue',
    label: 'Valor Total',
  })
  totalValue: number;

  @StringValidator({
    fieldName: 'observations',
    label: 'Observações Gerais',
    optional: true,
  })
  observations?: string;

  @NestedValidator({
    fieldName: 'items',
    label: 'Itens do Pedido',
    dto: PdvOrderItemDto,
    isArray: true,
  })
  @Type(() => PdvOrderItemDto)
  @ValidateNested({ each: true })
  items: PdvOrderItemDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ticketNumbers?: string[];

  @StringValidator({
    fieldName: 'sellerId',
    label: 'ID do Vendedor',
    optional: true,
  })
  sellerId?: string;
}
