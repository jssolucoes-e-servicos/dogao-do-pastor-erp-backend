import { DeliveryOptionEnum } from '@/common/enums';

export class PreSaleSetAddressDTO {
  preorderId: string;
  deliveryAddressId: string;
  deliveryOption: DeliveryOptionEnum;
}
