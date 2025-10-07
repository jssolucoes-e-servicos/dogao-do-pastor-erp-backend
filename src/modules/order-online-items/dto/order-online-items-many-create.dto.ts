import { MongoIdValidator } from '@/common/validators';
import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';
export class OrderOnlineItemsManyCreateDTO {
  @MongoIdValidator({
    fieldName: 'preOrderId ',
    label: 'ID da pre venda',
  })
  orderOnlineId: string;

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
