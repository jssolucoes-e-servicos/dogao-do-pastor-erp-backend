import { CommandStatusEnum } from 'src/common/enums';
import { EditionEntity, OrderEntity, WithdrawalEntity } from '.';

export class CommandEntity {
  id: string;
  sequentialId: string;
  order?: OrderEntity | null | undefined;
  orderId?: string | null | undefined;
  withdrawal?: WithdrawalEntity | null | undefined;
  withdrawalId?: string | null | undefined;
  edition?: EditionEntity | null | undefined;
  editionId: string;
  editionCode: number;
  sequence: number;
  printed: boolean;
  pdfUrl?: string | null | undefined;
  sentWhatsApp: boolean;
  sentAt?: Date | null;
  status: CommandStatusEnum;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null | undefined;
}
