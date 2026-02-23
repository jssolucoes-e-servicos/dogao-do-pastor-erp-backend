import { CommandEntity, DonationEntryEntity, PartnerEntity, WithdrawalItemEntity } from '.';
import { WithdrawalStatusEnum } from '../enums/withdrawal-status.enum';

export class WithdrawalEntity {
  id: string;
  partner?: PartnerEntity;
  partnerId: string;
  status: WithdrawalStatusEnum;
  scheduledAt: Date;
  items: WithdrawalItemEntity[];
  donationLogs: DonationEntryEntity[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  commands?: CommandEntity[];
}
