// src/common/entities/cell-network.entity.ts

import { CellEntity, ContributorEntity } from '.';

export class CellNetworkEntity {
  id: string;
  name: string;
  supervisor: ContributorEntity;
  supervisorId?: string;
  phone: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  cells: CellEntity[];
}
