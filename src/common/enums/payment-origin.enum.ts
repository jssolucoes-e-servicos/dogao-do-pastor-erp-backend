/* export enum PaymentOriginEnum {
  PREORDER = 'PREORDER',
  ORDER = 'ORDER',
  PDV = 'PDV',
}
 */
export const PaymentOriginEnum = {
  PREORDER: 'PREORDER',
  ORDER: 'ORDER',
  PDV: 'PDV',
} as const;

export type PaymentOriginEnum =
  (typeof PaymentOriginEnum)[keyof typeof PaymentOriginEnum];
