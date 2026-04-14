export const WithdrawalStatusEnum = {
  PENDING:   'PENDING',
  CONFIRMED: 'CONFIRMED',
  READY:     'READY',
  COMPLETED: 'COMPLETED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export type WithdrawalStatusEnum =
  (typeof WithdrawalStatusEnum)[keyof typeof WithdrawalStatusEnum];
