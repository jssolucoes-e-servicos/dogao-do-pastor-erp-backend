import { SetMetadata } from '@nestjs/common';

export type PermissionAction =
  | 'access'
  | 'create'
  | 'update'
  | 'delete'
  | 'report';

export const PERMISSION_METADATA_KEY = 'required_permission';

/**
 * moduleCtrl should match Module.ctrl (recommended).
 * action is one of PermissionAction.
 */
export const RequirePermission = (
  moduleCtrl: string,
  action: PermissionAction,
) => SetMetadata(PERMISSION_METADATA_KEY, { moduleCtrl, action });
