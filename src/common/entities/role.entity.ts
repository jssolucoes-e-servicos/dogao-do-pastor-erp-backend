// src/common/entities/role.entity.ts

import { PermissionEntity, UserRoleEntity } from ".";

export class RoleEntity {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  users: UserRoleEntity[];
  permissions: PermissionEntity[];
}
