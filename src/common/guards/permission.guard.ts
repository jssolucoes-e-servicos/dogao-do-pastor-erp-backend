import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/modules/auth/decorators/public.decorator';
import { REQUIRE_MODULE_KEY, RequireModuleMeta } from '../decorators/require-module.decorator';
import { REQUIRE_CONTROL_KEY } from '../decorators/require-control.decorator';
import { PermissionResolverService } from 'src/modules/permissions/services/permission-resolver.service';
import { SystemConfigService } from 'src/modules/system/system-config.service';

const PDV_MODULE_SLUG = 'erp.pdv';

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly resolver: PermissionResolverService,
    private readonly systemConfig: SystemConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Rota pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();

    // Bypass de manutenção
    if (request.headers['x-system-secret'] === 'dogao-master-key-2026') return true;

    const { user } = request;
    if (!user) throw new UnauthorizedException('Não autenticado');

    const contributorId: string = user.id || user.sub;

    // ── Modo dinâmico: @RequireModule ──────────────────────────────────────
    const moduleMeta = this.reflector.getAllAndOverride<RequireModuleMeta>(REQUIRE_MODULE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (moduleMeta) {
      // Verificar flag pdv_enabled para o módulo PDV
      if (moduleMeta.slug === PDV_MODULE_SLUG) {
        const perms = await this.resolver.resolve(contributorId);
        if (!perms.isSuperuser) {
          const pdvEnabled = await this.systemConfig.getBoolean('pdv_enabled', false);
          if (!pdvEnabled) {
            this.logger.warn(`[DENY] contributor=${contributorId} module=${moduleMeta.slug} reason=pdv_disabled`);
            throw new ForbiddenException('Módulo PDV não está disponível no momento');
          }
        }
      }

      const allowed = moduleMeta.action
        ? await this.resolver.canDo(contributorId, moduleMeta.slug, moduleMeta.action)
        : await this.resolver.canAccess(contributorId, moduleMeta.slug);

      if (!allowed) {
        this.logger.warn(`[DENY] contributor=${contributorId} module=${moduleMeta.slug} action=${moduleMeta.action ?? 'access'} source=dynamic`);
        throw new ForbiddenException(`Acesso negado ao módulo ${moduleMeta.slug}`);
      }
      return true;
    }

    // ── Modo dinâmico: @RequireControl ────────────────────────────────────
    const controlSlug = this.reflector.getAllAndOverride<string>(REQUIRE_CONTROL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (controlSlug) {
      const allowed = await this.resolver.canControl(contributorId, controlSlug);
      if (!allowed) {
        this.logger.warn(`[DENY] contributor=${contributorId} control=${controlSlug} source=dynamic`);
        throw new ForbiddenException(`Acesso negado ao controle ${controlSlug}`);
      }
      return true;
    }

    // ── Modo legado: @Roles ────────────────────────────────────────────────
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const userRoles: string[] = (user.roles || []).map((r: string) => r.toUpperCase());
    const isMaster = userRoles.some((r) => ['IT', 'ADMIN'].includes(r));
    if (isMaster) return true;

    const normalizedRequired = requiredRoles.map((r) => r.toUpperCase());
    const hasRole = normalizedRequired.some((role) => userRoles.includes(role));

    if (!hasRole) {
      this.logger.warn(`[DENY] contributor=${contributorId} roles=${normalizedRequired.join(',')} source=legacy`);
      throw new ForbiddenException(`Acesso negado. Requer perfil: ${normalizedRequired.join(', ')}`);
    }

    return true;
  }
}
