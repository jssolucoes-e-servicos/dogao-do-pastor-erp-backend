import { PaymentMethodEnum, PaymentStatsEnum } from 'src/common/enums';

export interface IPaymentRequest {
  orderId: string;
  customerId: string;
  amount: number;
  method: PaymentMethodEnum;
}

export interface IPaymentResponse {
  paymentId: string;
  status: PaymentStatsEnum;
  qrCode?: string;
  qrCodeBase64?: string;
  checkoutUrl?: string;
}
