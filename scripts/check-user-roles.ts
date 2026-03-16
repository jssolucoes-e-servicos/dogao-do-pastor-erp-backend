// scripts/check-user-roles.ts
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.contributor.findFirst({
      where: { username: 'jacksonsantos' },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        sellers: true,
        deliveryPersons: true,
        cells: true,
        cellNetworks: true,
      },
    });

    if (!user) {
      console.log('Usuário jacksonsantos não encontrado.');
      return;
    }

    console.log('--- DADOS DO USUÁRIO ---');
    console.log('ID:', user.id);
    console.log('Nome:', user.name);
    console.log('Username:', user.username);
    
    console.log('\n--- PERFIS (UserRoles) ---');
    user.userRoles.forEach(ur => {
      console.log(`- Role ID: ${ur.roleId} | Role Name: ${ur.role.name} | Active: ${ur.active}`);
    });

    console.log('\n--- VÍNCULOS ---');
    console.log('Vendedor:', user.sellers.length > 0 ? 'SIM' : 'NÃO');
    console.log('Entregador:', user.deliveryPersons.length > 0 ? 'SIM' : 'NÃO');
    console.log('Células:', user.cells.length > 0 ? 'SIM' : 'NÃO');
    console.log('Redes:', user.cellNetworks.length > 0 ? 'SIM' : 'NÃO');

  } catch (error) {
    console.error('Erro ao consultar banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
