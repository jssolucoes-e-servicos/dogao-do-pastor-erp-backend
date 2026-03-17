
import { PrismaClient } from './src/generated/client';
// @ts-expect-error - PrismaClient exige opções neste gerador customizado
const prisma = new PrismaClient();

async function main() {
  console.log('--- DIAGNÓSTICO DE BANCO DE DADOS ---');
  
  const editions = await prisma.edition.findMany({
    where: { active: true }
  });
  
  console.log(`Edições Ativas: ${editions.length}`);
  editions.forEach(e => {
    console.log(`- ID: ${e.id}, Nome: ${e.name}, Código: ${e.code}`);
  });

  if (editions.length > 0) {
    const activeEditionId = editions[0].id;
    const ordersCount = await prisma.order.count({
      where: { editionId: activeEditionId }
    });
    console.log(`Pedidos na edição ativa (${activeEditionId}): ${ordersCount}`);
    
    const paidOrders = await prisma.order.count({
      where: { editionId: activeEditionId, paymentStatus: 'PAID' }
    });
    console.log(`Pedidos PAGOS na edição ativa: ${paidOrders}`);

    const allOrders = await prisma.order.count();
    console.log(`Total de pedidos no banco (todas as edições): ${allOrders}`);
  } else {
    const allEditions = await prisma.edition.count();
    console.log(`Total de edições no banco: ${allEditions}`);
    const lastEdition = await prisma.edition.findFirst({
        orderBy: { createdAt: 'desc' }
    });
    if (lastEdition) {
        console.log(`Última edição criada: ${lastEdition.name} (Active: ${lastEdition.active})`);
    }
  }

  const contributors = await prisma.contributor.count();
  console.log(`Total de colaboradores: ${contributors}`);

  const itUsers = await prisma.userRole.findMany({
    where: { role: { name: 'IT' } },
    include: { contributor: true, role: true }
  });
  console.log(`Usuários com papel IT: ${itUsers.length}`);
  itUsers.forEach(u => {
    console.log(`- ${u.contributor.username} (${u.contributor.name})`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
