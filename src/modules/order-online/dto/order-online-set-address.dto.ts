import { DeliveryOptionEnum } from '@/common/enums';

export class OrderOnlineSetAddressDTO {
  preorderId: string;
  deliveryAddressId: string;
  deliveryOption: DeliveryOptionEnum;
}
