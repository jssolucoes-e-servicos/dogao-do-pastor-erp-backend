const { PrismaClient } = require('../src/generated/client'); // Tentando caminho relativo ao scratch
const prisma = new PrismaClient();

async function main() {
  console.log('--- DIAGNÓSTICO DE CONFIGURAÇÕES ---');
  try {
    const configs = await prisma.systemConfig.findMany();
    console.log('Registros encontrados:', configs.length);
    configs.forEach(c => {
      console.log(`- ID: ${c.id} | KEY: "${c.key}" | VALUE: "${c.value}"`);
    });

    const pdv = configs.find(c => c.key === 'pdv_enabled');
    if (!pdv) {
      console.log('A chave pdv_enabled NÃO EXISTE. Criando agora...');
      await prisma.systemConfig.create({
        data: {
          key: 'pdv_enabled',
          value: 'false',
          description: 'Habilita o módulo PDV'
        }
      });
      console.log('Chave criada com sucesso!');
    } else {
      console.log('A chave pdv_enabled já existe.');
      // Força o valor para true para testar se grava
      console.log('Tentando forçar pdv_enabled = "true"...');
      await prisma.systemConfig.update({
        where: { key: 'pdv_enabled' },
        data: { value: 'true' }
      });
      console.log('Update realizado com sucesso.');
    }
  } catch (err) {
    console.error('ERRO AO ACESSAR BANCO:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
