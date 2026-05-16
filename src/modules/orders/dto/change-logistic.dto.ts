import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DeliveryOptionEnum } from 'src/common/enums';

export class ChangeLogisticDto {
  @IsEnum(DeliveryOptionEnum)
  type: DeliveryOptionEnum;

  @IsOptional()
  @IsString()
  addressId?: string;

  @IsOptional()
  @IsString()
  scheduledTime?: string;
}
