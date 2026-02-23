import { CommandStatusEnum } from 'src/common/enums';
import { EditionEntity, OrderEntity, WithdrawalEntity } from '.';
import { Withdrawal } from 'src/generated/client';

export class CommandEntity {
  id: string;
  sequentialId: string;
  order?: OrderEntity;
  orderId?: string;
  withdrawal?: WithdrawalEntity;
  withdrawalId?: string;
  edition?: EditionEntity;
  editionId: string;
  editionCode: number;
  sequence: number;
  printed: boolean;
  pdfUrl?: string;
  sentWhatsApp: boolean;
  sentAt?: Date;
  status: CommandStatusEnum;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
