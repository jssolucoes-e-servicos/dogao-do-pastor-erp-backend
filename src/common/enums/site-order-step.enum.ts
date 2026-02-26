/* export enum SiteOrderStepEnum {
  CUSTOMER = 'CUSTOMER',
  ORDER = 'ORDER',
  DELIVERY = 'DELIVERY',
  PAYMENT = 'PAYMENT',
  PIX = 'PIX',
  CARD = 'CARD',
  ANALYSIS = 'ANALYSIS',
  THANKS = 'THANKS',
}
 */
export const SiteOrderStepEnum = {
  CUSTOMER: 'CUSTOMER',
  ORDER: 'ORDER',
  DELIVERY: 'DELIVERY',
  PAYMENT: 'PAYMENT',
  PIX: 'PIX',
  CARD: 'CARD',
  ANALYSIS: 'ANALYSIS',
  THANKS: 'THANKS',
} as const;

export type SiteOrderStepEnum =
  (typeof SiteOrderStepEnum)[keyof typeof SiteOrderStepEnum];
