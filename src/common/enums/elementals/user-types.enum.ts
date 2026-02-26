// src/common/enums/elementals/login-stats.ts
/* 
export enum UserTypesEnum {
  PARTNER = 'PARTNER',
  CUSTOMER = 'CUSTOMER',
  CONTRIBUTOR = 'CONTRIBUTOR',
}
 */
export const UserTypesEnum = {
  PARTNER: 'PARTNER',
  CUSTOMER: 'CUSTOMER',
  CONTRIBUTOR: 'CONTRIBUTOR',
} as const;

export type UserTypesEnum = (typeof UserTypesEnum)[keyof typeof UserTypesEnum];
