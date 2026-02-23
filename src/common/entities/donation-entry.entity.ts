// src/common/entities/donatino-entry.entity.ts

import { DonationEntryTypeEnum } from 'src/common/enums';
import { OrderEntity, PartnerEntity, WithdrawalEntity } from '.';

export class DonationEntryEntity {
  id: string;
  partner?: PartnerEntity;
  partnerId: string;
  order?: OrderEntity;
  orderId?: string | null;
  withdrawal?: WithdrawalEntity;
  withdrawalId?: string;
  quantity: number; 
  type: DonationEntryTypeEnum;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
