/* export enum PaymentProviderEnum {
  MERCADOPAGO = 'MERCADOPAGO',
  MANUAL = 'MANUAL',
}
 */
export const PaymentProviderEnum = {
  MERCADOPAGO: 'MERCADOPAGO',
  MANUAL: 'MANUAL',
} as const;

export type PaymentProviderEnum =
  (typeof PaymentProviderEnum)[keyof typeof PaymentProviderEnum];
