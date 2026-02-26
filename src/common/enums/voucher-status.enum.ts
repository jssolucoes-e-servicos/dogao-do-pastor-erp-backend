/* export enum VoucherStatusEnum {
  NEW = 'NEW',
  REGISTERED = 'REGISTERED',
  USED = 'USED',
  CANCELLED = 'CANCELLED',
}
 */

export const VoucherStatusEnum = {
  NEW: 'NEW',
  REGISTERED: 'REGISTERED',
  USED: 'USED',
  CANCELLED: 'CANCELLED',
} as const;

export type VoucherStatusEnum =
  (typeof VoucherStatusEnum)[keyof typeof VoucherStatusEnum];
