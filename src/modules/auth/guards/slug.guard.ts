import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionResolverService } from 'src/modules/permissions/services/permission-resolver.service';

/**
 * Guard que valida acesso por slug de módulo — o mesmo sistema usado no ERP.
 * Deve ser usado junto com JwtAuthGuard.
 *
 * Uso no controller:
 *   @UseGuards(JwtAuthGuard, SlugGuard)
 *   @RequireSlug('erp.my-cell')
 *   async minhaRota() {}
 */
@Injectable()
export class SlugGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionResolver: PermissionResolverService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredSlugs = this.reflector.getAllAndOverride<string[]>('required_slugs', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Sem slug definido = rota não protegida por slug (passa)
    if (!requiredSlugs || requiredSlugs.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) throw new ForbiddenException('Usuário não identificado');

    // Superusuários passam sempre
    const userRoles: string[] = (user.roles || []).map((r: string) => r.toUpperCase());
    const isMaster = userRoles.some(r => ['IT', 'TI', 'ADMIN'].includes(r));
    if (isMaster) return true;

    // Verifica se tem acesso a QUALQUER um dos slugs requeridos
    for (const slug of requiredSlugs) {
      const allowed = await this.permissionResolver.canAccess(user.id, slug);
      if (allowed) return true;
    }

    throw new ForbiddenException(
      `Acesso negado. Requer permissão para: ${requiredSlugs.join(' ou ')}`
    );
  }
}
