// src/common/enums/elementals/login-stats.ts

/* export enum LoginStatsEnum {
  NOT_VERIFIELD = 'NOT_VERIFIELD',
  AVAILABLE = 'AVAILABLE',
  LOCKED = 'LOCKED',
  IN_RECOVERY = 'IN_RECOVERY',
}
 */

export const LoginStatsEnum = {
  NOT_VERIFIELD: 'NOT_VERIFIELD',
  AVAILABLE: 'AVAILABLE',
  LOCKED: 'LOCKED',
  IN_RECOVERY: 'IN_RECOVERY',
} as const;

export type LoginStatsEnum =
  (typeof LoginStatsEnum)[keyof typeof LoginStatsEnum];
