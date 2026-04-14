import { Injectable } from '@nestjs/common';
import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';

@Injectable()
export class SetupService extends BaseService {
  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
  ) {
    super(configService, loggerService, prismaService);
  }

  async runInitialSetup() {
    this.logger.log('Iniciando setup inicial de permissões e roles...');

    // 1. Normalizar Roles para Inglês
    const roles = [
      { id: 'clz_role_ti_001', name: 'IT', description: 'Full access and system maintenance' },
      { id: 'clz_role_adm_002', name: 'ADMIN', description: 'General management' },
      { id: 'clz_role_fin_003', name: 'FINANCE', description: 'Financial management' },
      { id: 'clz_role_rec_004', name: 'RECEPTION', description: 'Customer service and reception' },
      { id: 'clz_role_exp_008', name: 'EXPEDITION', description: 'Delivery control' },
      { id: 'clz_role_sel_010', name: 'SELLER', description: 'Seller' },
      { id: 'clz_role_del_011', name: 'DELIVERY', description: 'Delivery person' },
      { id: 'clz_role_ldr_012', name: 'LEADER', description: 'Cell leader' },
      { id: 'clz_role_mng_013', name: 'MANAGER', description: 'Network manager' },
    ];

    for (const role of roles) {
      await this.prisma.role.upsert({
        where: { id: role.id },
        update: { name: role.name },
        create: role,
      });
    }

    // 2. Criar Módulos Iniciais
    const modules = [
      { id: 'sys_mod_dash',      name: 'Dashboard',     slug: 'erp.dashboard',    description: 'Painel de indicadores', ctrl: 'dashboard',    page: '/' },
      { id: 'sys_mod_orders',    name: 'Pedidos',        slug: 'erp.pedidos',      description: 'Gestão de pedidos',     ctrl: 'orders',       page: '/pedidos' },
      { id: 'sys_mod_customers', name: 'Clientes',       slug: 'erp.clientes',     description: 'Gestão de clientes',    ctrl: 'customers',    page: '/clientes' },
      { id: 'sys_mod_partners',  name: 'Parceiros',      slug: 'erp.parceiros',    description: 'Gestão de parceiros',   ctrl: 'partners',     page: '/parceiros' },
      { id: 'sys_mod_sellers',   name: 'Vendedores',     slug: 'erp.vendedores',   description: 'Gestão de vendedores',  ctrl: 'sellers',      page: '/vendedores' },
      { id: 'sys_mod_staff',     name: 'Colaboradores',  slug: 'erp.colaboradores',description: 'Gestão de acesso',      ctrl: 'contributors', page: '/colaboradores' },
    ];

    for (const mod of modules) {
      await this.prisma.module.upsert({
        where: { id: mod.id },
        update: { name: mod.name, ctrl: mod.ctrl, page: mod.page },
        create: mod,
      });
    }

    // 3. Vincular jacksonsantos como TI
    const jackson = await this.prisma.contributor.findFirst({
      where: { username: 'jacksonsantos' },
    });

    if (jackson) {
      await this.prisma.userRole.upsert({
        where: {
          contributorId_roleId: {
            contributorId: jackson.id,
            roleId: 'clz_role_ti_001'
          }
        },
        update: { active: true },
        create: {
          contributorId: jackson.id,
          roleId: 'clz_role_ti_001',
          active: true,
        },
      });

      // Dar permissões Full para TI em todos os módulos
      for (const mod of modules) {
        await this.prisma.permission.upsert({
          where: { id: `perm_ti_${mod.id}` },
          update: { access: true, create: true, update: true, delete: true, report: true },
          create: {
            id: `perm_ti_${mod.id}`,
            roleId: 'clz_role_ti_001',
            moduleId: mod.id,
            access: true,
            create: true,
            update: true,
            delete: true,
            report: true,
          },
        });
      }
      this.logger.log(`Setup de permissões concluído para o usuário: ${jackson.username}`);
    } else {
      this.logger.warn('Usuário jacksonsantos não encontrado para atribuição de TI.');
    }

    return { success: true, message: 'Setup de Roles e Permissões concluído.' };
  }
}
