import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/helpers/importer.helper';
import { PermissionCacheService } from './permission-cache.service';
import {
  EffectivePermissions,
  ModulePermission,
  PermissionAction,
} from '../interfaces/effective-permissions.interface';

const SUPERUSER_ROLES = ['IT', 'ADMIN', 'TI', 'T.I', 'ADMINISTRAÇÃO'];

@Injectable()
export class PermissionResolverService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: PermissionCacheService,
  ) {}

  async resolve(contributorId: string): Promise<EffectivePermissions> {
    const cached = this.cache.get(contributorId);
    if (cached) return cached;

    // 1. Buscar roles ativas do contributor
    const userRoles = await this.prisma.userRole.findMany({
      where: { contributorId, active: true, deletedAt: null },
      include: { role: true },
    });

    const roleIds = userRoles.map((ur) => ur.roleId);
    const roleNames = userRoles.map((ur) => ur.role.name.toUpperCase());
    const isSuperuser = roleNames.some((r) => SUPERUSER_ROLES.includes(r));

    if (isSuperuser) {
      const perms: EffectivePermissions = {
        contributorId,
        isSuperuser: true,
        modules: {},
        controls: [],
        dashboardCards: [],
        resolvedAt: new Date(),
      };
      this.cache.set(contributorId, perms);
      return perms;
    }

    // 2. Permissões por role
    const rolePerms = await this.prisma.permission.findMany({
      where: { roleId: { in: roleIds }, active: true, deletedAt: null },
      include: { module: true },
    });

    // 3. Permissões individuais do contributor
    const individualPerms = await this.prisma.permission.findMany({
      where: { contributorId, roleId: null, active: true, deletedAt: null },
      include: { module: true },
    });

    // 4. Union semântica (OR lógico por módulo)
    const modulesMap: Record<string, ModulePermission> = {};
    const mergePermission = (slug: string, p: any) => {
      if (!modulesMap[slug]) {
        modulesMap[slug] = { access: false, create: false, update: false, delete: false, report: false };
      }
      modulesMap[slug].access  = modulesMap[slug].access  || p.access;
      modulesMap[slug].create  = modulesMap[slug].create  || p.create;
      modulesMap[slug].update  = modulesMap[slug].update  || p.update;
      modulesMap[slug].delete  = modulesMap[slug].delete  || p.delete;
      modulesMap[slug].report  = modulesMap[slug].report  || p.report;
    };

    for (const p of [...rolePerms, ...individualPerms]) {
      if (p.module?.slug) mergePermission(p.module.slug, p);
    }

    // 5. ControlPermissions
    const controlPerms = await this.prisma.controlPermission.findMany({
      where: {
        active: true,
        deletedAt: null,
        OR: [
          { roleId: { in: roleIds } },
          { contributorId },
        ],
      },
      include: { control: true },
    });
    const controls = [...new Set(controlPerms.map((cp) => cp.control.slug))];

    // 6. Dashboard cards (union de todas as roles ativas)
    const roles = await this.prisma.role.findMany({
      where: { id: { in: roleIds }, active: true, deletedAt: null },
      select: { dashboardCards: true },
    });
    const dashboardCards = [...new Set(roles.flatMap((r) => r.dashboardCards))];

    const perms: EffectivePermissions = {
      contributorId,
      isSuperuser: false,
      modules: modulesMap,
      controls,
      dashboardCards,
      resolvedAt: new Date(),
    };

    this.cache.set(contributorId, perms);
    return perms;
  }

  async canAccess(contributorId: string, moduleSlug: string): Promise<boolean> {
    const perms = await this.resolve(contributorId);
    if (perms.isSuperuser) return true;
    return perms.modules[moduleSlug]?.access === true;
  }

  async canDo(contributorId: string, moduleSlug: string, action: PermissionAction): Promise<boolean> {
    const perms = await this.resolve(contributorId);
    if (perms.isSuperuser) return true;
    return perms.modules[moduleSlug]?.[action] === true;
  }

  async canControl(contributorId: string, controlSlug: string): Promise<boolean> {
    const perms = await this.resolve(contributorId);
    if (perms.isSuperuser) return true;
    return perms.controls.includes(controlSlug);
  }

  invalidateCache(contributorId: string): void {
    this.cache.invalidate(contributorId);
  }
}
