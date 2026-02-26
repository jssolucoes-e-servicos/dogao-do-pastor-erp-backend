/* export enum OrderOriginEnum {
  SITE = "SITE",
  TICKET = "TICKET",
  PDV = "PDV",
} */

export const OrderOriginEnum = {
  SITE: 'SITE',
  TICKET: 'TICKET',
  PDV: 'PDV',
} as const;

export type OrderOriginEnum =
  (typeof OrderOriginEnum)[keyof typeof OrderOriginEnum];
