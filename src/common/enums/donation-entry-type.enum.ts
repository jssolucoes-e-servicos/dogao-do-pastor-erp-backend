/* export enum DonationEntryTypeEnum {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}
 */
export const DonationEntryTypeEnum = {
  CREDIT: 'CREDIT',
  DEBIT: 'DEBIT',
} as const;

export type DonationEntryTypeEnum =
  (typeof DonationEntryTypeEnum)[keyof typeof DonationEntryTypeEnum];
