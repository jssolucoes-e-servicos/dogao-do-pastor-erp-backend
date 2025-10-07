import { OrderStatsEnum } from '@/common/enums/order-stats.enum';
import { MongoIdValidator, StringValidator } from '@/common/validators';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsString, ValidateNested } from 'class-validator';
export class OrderOnlineCreateDTO {
  @MongoIdValidator({
    fieldName: 'customerId',
    label: 'Id do Clinte',
    optional: true,
  })
  customerId?: string | null;

  @MongoIdValidator({
    fieldName: 'deliveryAddressId',
    label: 'ID do endereço (en caso de entrega)',
    optional: true,
  })
  deliveryAddressId?: string | null;

  @StringValidator({ fieldName: 'deliveryOption', label: 'Tipo de Pedido' })
  deliveryOption: string;

  @StringValidator({ fieldName: 'status', label: 'Situação', optional: true })
  @IsEnum(OrderStatsEnum)
  status?: OrderStatsEnum;

  @StringValidator({
    fieldName: 'observations',
    label: 'Observações',
    optional: true,
  })
  observations?: string;

  @IsArray()
  @ValidateNested()
  @Type(() => PreOrderItemDTO)
  orderItems: PreOrderItemDTO[];
}

class PreOrderItemDTO {
  @IsArray()
  @IsString()
  removedIngredients?: string[];
}
