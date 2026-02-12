// src/common/entities/permission.entity.ts

import { ContributorEntity, ModuleEntity, RoleEntity } from ".";

export class PermissionEntity {
  id: string;
  contributor?: ContributorEntity;
  contributorId: string;
  role?: RoleEntity;
  roleId?: string;
  module: ModuleEntity;
  moduleId: string;
  access: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  report: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
