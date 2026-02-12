import {
  CellEntity,
  ContributorEntity,
  OrderEntity,
  SellerSettlementEntity,
  TicketEntity,
} from '.';

export class SellerEntity {
  id: string;
  name: string;
  cell: CellEntity;
  cellId: string;
  contributor: ContributorEntity;
  contributorId: string;
  tag: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  tickets: TicketEntity[];
  orders: OrderEntity[];
  settlements: SellerSettlementEntity[];
}
