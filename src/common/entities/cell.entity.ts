// src/common/entities/cell.entity.ts

import { CellNetworkEntity, ContributorEntity, SellerEntity } from '.';

export class CellEntity {
  id: string;
  name: string;
  network: CellNetworkEntity;
  networkId: string;
  leader: ContributorEntity;
  leaderId?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  sellers: SellerEntity[];
}
