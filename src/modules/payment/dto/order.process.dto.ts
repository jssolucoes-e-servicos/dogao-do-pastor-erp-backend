import {
  DeliveryOptionEnum,
  OrderStatsEnum,
  PreOrderStepEnum,
} from '@/common/enums';

export interface IOderProccessDTO {
  id: string;
  customerId: string | null;
  editionId: string;
  sellerId: string;
  sellerTag: string;
  quantity: number;
  valueTotal: number;
  paymentStatus: string;
  paymentProvider: string;
  paymentId: string | null;
  paymentUrl: string | null;
  paymentMethod: string | null;
  paymentPixQrcode: string | null;
  paymentPixCopyPaste: string | null;
  customerAddressId: string | null;
  observations: string | null;
  deliveryOption: DeliveryOptionEnum;
  status: OrderStatsEnum;
  isPromo: boolean;
  step: PreOrderStepEnum;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
