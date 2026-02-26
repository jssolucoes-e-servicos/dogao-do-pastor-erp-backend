/* export enum DeliveryStopStatusEnum {
  PENDING = 'PENDING',
  DELIVERING = 'DELIVERING',
  DELIVERED = 'DELIVERED',
  SKIPPED = 'SKIPPED',
  FAILED = 'FAILED',
}
 */
export const DeliveryStopStatusEnum = {
  PENDING: 'PENDING',
  DELIVERING: 'DELIVERING',
  DELIVERED: 'DELIVERED',
  SKIPPED: 'SKIPPED',
  FAILED: 'FAILED',
} as const;

export type DeliveryStopStatusEnum =
  (typeof DeliveryStopStatusEnum)[keyof typeof DeliveryStopStatusEnum];
