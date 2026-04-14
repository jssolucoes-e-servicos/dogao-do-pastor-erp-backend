import { SetMetadata } from '@nestjs/common';
import { PermissionAction } from 'src/modules/permissions/interfaces/effective-permissions.interface';

export const REQUIRE_MODULE_KEY = 'require_module';

export interface RequireModuleMeta {
  slug: string;
  action?: PermissionAction;
}

export const RequireModule = (slug: string, action?: PermissionAction) =>
  SetMetadata(REQUIRE_MODULE_KEY, { slug, action } as RequireModuleMeta);
