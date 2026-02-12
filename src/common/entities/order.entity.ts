import {
  DeliveryOptionEnum,
  OrderOriginEnum,
  OrderStatusEnum,
  PaymentMethodEnum,
  PaymentStatusEnum,
  SiteOrderStepEnum,
} from 'src/common/enums';
import {
  CommandEntity,
  CustomerAddressEntity,
  CustomerEntity,
  DeliveryStopEntity,
  EditionEntity,
  OrderItemEntity,
  PaymentEntity,
  SellerEntity,
  TicketEntity,
  VoucherEntity,
} from './';

export class OrderEntity {
  id: string;
  edition: EditionEntity;
  editionId: string;
  customer: CustomerEntity;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerCPF: string;
  seller: SellerEntity;
  sellerId: string;
  sellerTag: string;
  origin: OrderOriginEnum;
  totalValue: number;
  status: OrderStatusEnum;
  siteStep: SiteOrderStepEnum;
  deliveryOption: DeliveryOptionEnum;
  deliveryTime?: string;
  address?: CustomerAddressEntity;
  addressId?: string;
  observations?: string;
  paymentStatus: PaymentStatusEnum;
  paymentType: PaymentMethodEnum;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
  items?: OrderItemEntity[];
  vouchers?: VoucherEntity[];
  tickets?: TicketEntity[];
  payments?: PaymentEntity[];
  commands?: CommandEntity[];
  deliveryStops?: DeliveryStopEntity[];
}
