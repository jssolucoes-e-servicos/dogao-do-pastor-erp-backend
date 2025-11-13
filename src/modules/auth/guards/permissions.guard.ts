import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_METADATA_KEY } from '../decorators/require-permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const meta = this.reflector.get<{ moduleCtrl: string; action: string }>(
      PERMISSION_METADATA_KEY,
      context.getHandler(),
    );
    if (!meta) return true; // no permission required

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) throw new ForbiddenException('No user in request');

    const permissions = user.permissions || [];
    // find permission for module
    const perm = permissions.find((p: any) => {
      const key = (p.module || p.moduleName || p.module).toString();
      return key === meta.moduleCtrl;
    });

    if (!perm || !perm[meta.action]) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
