// src/common/enums/order-origin.enum.ts
export const OrderOriginEnum = {
  APP: 'APP',
  MANUAL: 'MANUAL',
  SITE: 'SITE',
  PDV: 'PDV',
} as const;

export type OrderOriginEnum =
  (typeof OrderOriginEnum)[keyof typeof OrderOriginEnum];
