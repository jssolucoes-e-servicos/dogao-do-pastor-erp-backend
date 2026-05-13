const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- DIAGNÓSTICO DE LOGÍSTICA ---');
  const orders = await prisma.order.findMany({
    where: { deliveryType: 'DELIVERY' },
    include: { address: true },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  if (orders.length === 0) {
    console.log('Nenhum pedido de entrega encontrado.');
    return;
  }

  orders.forEach(o => {
    console.log(`\nPedido: #${o.id.slice(-5)}`);
    console.log(`Status: ${o.status}`);
    if (o.address) {
      console.log(`Endereço: ${o.address.street}, ${o.address.number} - ${o.address.neighborhood}`);
      console.log(`Coordenadas: LAT: ${o.address.lat}, LNG: ${o.address.lng}`);
    } else {
      console.log('ERRO: Pedido sem endereço vinculado!');
    }
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
