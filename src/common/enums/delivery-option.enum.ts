/* export enum DeliveryOptionEnum {
  UNDEFINED = 'UNDEFINED',
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
  DONATE = 'DONATE',
  SCHEDULED = 'SCHEDULED',
}
 */

export const DeliveryOptionEnum = {
  UNDEFINED: 'UNDEFINED',
  PICKUP: 'PICKUP',
  DELIVERY: 'DELIVERY',
  DONATE: 'DONATE',
  SCHEDULED: 'SCHEDULED',
} as const;

export type DeliveryOptionEnum =
  (typeof DeliveryOptionEnum)[keyof typeof DeliveryOptionEnum];
