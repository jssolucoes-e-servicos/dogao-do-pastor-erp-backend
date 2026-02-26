/* export enum WithdrawalStatusEnum {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}
 */

export const WithdrawalStatusEnum = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type WithdrawalStatusEnum =
  (typeof WithdrawalStatusEnum)[keyof typeof WithdrawalStatusEnum];
