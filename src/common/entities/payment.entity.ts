import {
  PaymentMethodEnum,
  PaymentOriginEnum,
  PaymentProviderEnum,
  PaymentStatusEnum,
} from 'src/common/enums';
import { OrderEntity, PaymentEventEntity } from '.';

export class PaymentEntity {
  id: string;
  order?: OrderEntity | null;
  orderId: string;
  origin: PaymentOriginEnum;
  value: number;
  status: PaymentStatusEnum;
  provider: PaymentProviderEnum;
  providerPaymentId?: string | null;
  method: PaymentMethodEnum;
  pixQrcode?: string | null;
  pixCopyPaste?: string | null;
  paymentUrl?: string | null;
  cardToken?: string | null;
  rawPayload?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  events?: PaymentEventEntity[];
}
