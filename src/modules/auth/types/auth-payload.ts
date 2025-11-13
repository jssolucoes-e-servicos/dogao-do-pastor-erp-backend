import { PermissionPayload } from '../services/auth.service';

export interface AuthPayload {
  sub: string;
  username: string;
  roles: string[];
  permissions: PermissionPayload[];
}
