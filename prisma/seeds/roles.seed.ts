import { PrismaClient } from '@prisma/client';

export async function seedRoles(prisma: PrismaClient) {
  const roles = [
    // Perfis Administrativos/T.I
    { id: 'clz_role_ti_001', name: 'T.I', description: 'Acesso total e manutenção do sistema' },
    { id: 'clz_role_adm_002', name: 'Administração', description: 'Gestão geral (Pastores/Diretoria)' },

    // Perfis de Operação (Processos)
    { id: 'clz_role_fin_003', name: 'Financeiro', description: 'Gestão de pagamentos e entradas' },
    { id: 'clz_role_rec_004', name: 'Recepção', description: 'Atendimento e triagem' },
    { id: 'clz_role_est_005', name: 'Estoque', description: 'Controle de insumos' },
    { id: 'clz_role_pro_006', name: 'Produção', description: 'Ponta de linha - Montagem' },
    { id: 'clz_role_fin_007', name: 'Finalização', description: 'Início da linha - Triagem de pedidos' },
    { id: 'clz_role_exp_008', name: 'Expedição', description: 'Controle de entregas' },
    { id: 'clz_role_bal_009', name: 'Balcão', description: 'Controle de retiradas no local' },

    // Perfis Vinculados a Tabelas (Entidades)
    { id: 'clz_role_sel_010', name: 'Vendedor', description: 'Vínculo com tabela de Sellers' },
    { id: 'clz_role_del_011', name: 'Entregador', description: 'Vínculo com tabela de DeliveryPerson' },
    { id: 'clz_role_sup_012', name: 'Supervisor de Rede', description: 'Vínculo com tabela de CellNetwork' },
    { id: 'clz_role_led_013', name: 'Líder de Célula', description: 'Vínculo com tabela de Cell' },
  ];

  for (const role of roles) {
    const exists = await prisma.role.findUnique({
      where: { id: role.id },
    });

    if (exists) continue;

    await prisma.role.create({
      data: role,
    });
  }

  console.log('✅ Seed de Roles finalizado.');
}
