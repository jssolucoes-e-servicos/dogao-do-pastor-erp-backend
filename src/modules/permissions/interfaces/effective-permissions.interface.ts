export interface ModulePermission {
  access: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  report: boolean;
}

export type PermissionAction = 'create' | 'update' | 'delete' | 'report';

export interface EffectivePermissions {
  contributorId: string;
  isSuperuser: boolean;
  modules: Record<string, ModulePermission>; // key: slug
  controls: string[];                         // slugs de controls acessíveis
  dashboardCards: string[];
  resolvedAt: Date;
}
