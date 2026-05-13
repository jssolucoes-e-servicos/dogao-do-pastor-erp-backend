const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- VERIFICANDO COLUNAS DE GEOLOCALIZAÇÃO ---');
  try {
    // Busca um endereço qualquer para ver se as colunas existem
    const address = await prisma.customerAddress.findFirst();
    if (address) {
      console.log('Exemplo de endereço encontrado:');
      console.log('ID:', address.id);
      console.log('LAT:', address.lat === undefined ? 'NÃO EXISTE' : address.lat);
      console.log('LNG:', address.lng === undefined ? 'NÃO EXISTE' : address.lng);
    } else {
      console.log('Nenhum endereço encontrado para teste.');
    }
  } catch (err) {
    if (err.message.includes('column "lat" does not exist')) {
      console.log('ERRO: As colunas lat/lng NÃO existem no banco de dados ainda.');
    } else {
      console.error('ERRO INESPERADO:', err.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
