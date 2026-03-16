// scripts/debug-db.ts
import { PrismaClient } from '../src/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not found in .env');
    return;
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

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
    user.userRoles.forEach((ur: any) => {
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
    await pool.end();
  }
}

main();
