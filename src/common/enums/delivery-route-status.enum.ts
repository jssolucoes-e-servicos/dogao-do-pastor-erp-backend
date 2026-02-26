/* export enum DeliveryRouteStatusEnum {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}
 */
export const DeliveryRouteStatusEnum = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  FINISHED: 'FINISHED',
  CANCELLED: 'CANCELLED',
} as const;

export type DeliveryRouteStatusEnum =
  (typeof DeliveryRouteStatusEnum)[keyof typeof DeliveryRouteStatusEnum];
