// src/common/entities/contributor.entity.ts

import {
  CellEntity, CellNetworkEntity, DeliveryPersonEntity, PermissionEntity,
  SellerEntity, UserRoleEntity
} from '.';

export class ContributorEntity {
  id: string;
  name: string;
  phone?: string | null;
  photo?: string | null;
  username?: string | null;
  password: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  sellers?: SellerEntity[];
  cells?: CellEntity[];
  cellNetworks?: CellNetworkEntity[];
  deliveryPersons?: DeliveryPersonEntity[];
  userRoles?: UserRoleEntity[];
  permissions?: PermissionEntity[];
}
