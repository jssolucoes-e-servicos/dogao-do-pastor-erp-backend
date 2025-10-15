import { CustomerRetrieve } from '@/modules/customer/dto/customer-retrieve';

export class OrderOnlineFullRetrieveDTO {
  id: string;
  sellerId: string;
  sellerTag: string;
  customerId?: string | null;
  customer?: CustomerRetrieve | null;
  editionId: string;
  quantity: number;
  valueTotal: number;
  paymentStatus: string;
  paymentProvider: string;
  paymentId?: string | null;
  paymentUrl?: string | null;
  paymentMethod?: string | null;
  customerAddressId?: string | null;
  observations?: string | null;
  deliveryOption: string;
  status: string;
  isPromo: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
