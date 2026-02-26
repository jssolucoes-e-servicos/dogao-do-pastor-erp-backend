/* export enum PaymentMethodEnum {
  UNDEFINED = 'UNDEFINED',
  PIX = 'PIX',
  CARD = 'CARD',
  CARD_CREDIT = 'CARD_CREDIT',
  CARD_DEBIT = 'CARD_DEBIT',
  POS = 'POS',
  MONEY = 'MONEY',
} */
export const PaymentMethodEnum = {
  UNDEFINED: 'UNDEFINED',
  PIX: 'PIX',
  CARD: 'CARD',
  CARD_CREDIT: 'CARD_CREDIT',
  CARD_DEBIT: 'CARD_DEBIT',
  POS: 'POS',
  MONEY: 'MONEY',
} as const;

export type PaymentMethodEnum =
  (typeof PaymentMethodEnum)[keyof typeof PaymentMethodEnum];
