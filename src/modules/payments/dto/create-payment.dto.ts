import {
  PaymentMethodEnum,
  PaymentOriginEnum,
  PaymentProviderEnum,
  PaymentStatusEnum,
} from 'src/common/enums';
import {
  EnumValidator,
  NumberValidator,
  StringValidator,
} from 'src/common/validators';

export class CreatePaymentDTO {
  @StringValidator({
    fieldName: 'orderId',
    label: 'ID de pedido',
  })
  orderId: string;

  @EnumValidator({
    fieldName: 'orderId',
    label: 'ID de pedido',
    enumType: PaymentOriginEnum,
  })
  origin: PaymentOriginEnum;

  @NumberValidator({
    fieldName: 'orderId',
    label: 'ID de pedido',
  })
  value: number;

  @EnumValidator({
    fieldName: 'orderId',
    label: 'ID de pedido',
    enumType: PaymentStatusEnum,
  })
  status: PaymentStatusEnum;

  @EnumValidator({
    fieldName: 'orderId',
    label: 'ID de pedido',
    enumType: PaymentProviderEnum,
  })
  provider: PaymentProviderEnum;

  @StringValidator({
    fieldName: 'orderId',
    label: 'ID de pedido',
    optional: true,
  })
  providerPaymentId?: string | null;

  @EnumValidator({
    fieldName: 'orderId',
    label: 'ID de pedido',
    enumType: PaymentMethodEnum,
  })
  method: PaymentMethodEnum;

  @StringValidator({
    fieldName: 'orderId',
    label: 'ID de pedido',
    optional: true,
  })
  pixQrcode?: string | null;

  @StringValidator({
    fieldName: 'orderId',
    label: 'ID de pedido',
    optional: true,
  })
  pixCopyPaste?: string | null;

  @StringValidator({
    fieldName: 'orderId',
    label: 'ID de pedido',
    optional: true,
  })
  paymentUrl?: string | null;

  @StringValidator({
    fieldName: 'orderId',
    label: 'ID de pedido',
    optional: true,
  })
  cardToken?: string | null;

  @StringValidator({
    fieldName: 'orderId',
    label: 'ID de pedido',
    optional: true,
  })
  rawPayload?: string | null;
}
