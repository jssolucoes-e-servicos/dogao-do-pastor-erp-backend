import { EditionEntity, SellerEntity } from ".";

export class SellerSettlementEntity {
  id: string;
  edition: EditionEntity;
  editionId: string;
  seller: SellerEntity;
  sellerId: string;
  totalTicketsSold: number;
  totalValue: number;
  totalReturned: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
