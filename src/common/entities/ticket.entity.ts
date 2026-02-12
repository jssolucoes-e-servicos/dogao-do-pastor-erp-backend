import { EditionEntity, OrderEntity, SellerEntity } from ".";

export class TicketEntity {
  id: string;
  edition: EditionEntity;
  editionId: string;
  number: string;
  ordered: boolean;

  seller: SellerEntity;
  sellerId: string;

  order?: OrderEntity;
  orderId?: string;

  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
