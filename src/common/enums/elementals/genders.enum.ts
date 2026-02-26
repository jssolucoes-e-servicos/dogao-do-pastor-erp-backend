// src/common/enums/elementals/gender.enum.ts

/* export enum GendersEnum {
  FEMALE = 'FEMALE',
  MALE = 'MALE',
} */

export const GendersEnum = {
  FEMALE: 'FEMALE',
  MALE: 'MALE',
} as const;

export type GendersEnum = (typeof GendersEnum)[keyof typeof GendersEnum];