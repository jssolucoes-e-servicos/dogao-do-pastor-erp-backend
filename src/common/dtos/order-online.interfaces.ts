import { ICustomerAddress } from './customer-address.interface';
import { ICustomer } from './customer.interface';
import { ISeller } from './seller.interface';

export interface IOrderOnline {
  id: string;
  customerId: string;
  customer: ICustomer;
  editionId: string;
  sellerId: string;
  seller?: ISeller;
  sellerTag: string;
  quantity: number;
  valueTotal: number;
  paymentStatus: string;
  paymentProvider: string;
  paymentId?: string | null;
  paymentMethod?: string | null;
  paymentUrl?: string | null;
  customerAddressId?: string | null;
  address?: ICustomerAddress | null | undefined;
  observations: string;
  deliveryOption: string;
  status: string;
  isPromo: boolean;
  step: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
