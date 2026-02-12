import { CommandStatusEnum } from 'src/common/enums';
import { EditionEntity, OrderEntity } from '.';

export class CommandEntity {
  id: string;
  sequentialId: string;
  order: OrderEntity;
  orderId: string;
  edition: EditionEntity;
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
