
const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:DEV1jssolucoes@localhost:5432/dogao-do-pastor?schema=public"
  });

  try {
    await client.connect();
    console.log('--- DIAGNÓSTICO SQL DIRETO ---');
    
    const editionsResult = await client.query('SELECT id, name, code, active FROM editions WHERE active = true');
    console.log(`Edições Ativas: ${editionsResult.rows.length}`);
    editionsResult.rows.forEach(e => {
      console.log(`- ID: ${e.id}, Nome: ${e.name}, Código: ${e.code}`);
    });

    if (editionsResult.rows.length > 0) {
      const activeEditionId = editionsResult.rows[0].id;
      
      const ordersCountResult = await client.query('SELECT count(*) FROM orders WHERE "editionId" = $1', [activeEditionId]);
      console.log(`Pedidos na edição ativa: ${ordersCountResult.rows[0].count}`);
      
      const paidOrdersResult = await client.query('SELECT count(*) FROM orders WHERE "editionId" = $1 AND "paymentStatus" = $2', [activeEditionId, 'PAID']);
      console.log(`Pedidos PAGOS na edição ativa: ${paidOrdersResult.rows[0].count}`);

      const pendingOrdersResult = await client.query('SELECT count(*) FROM orders WHERE "editionId" = $1 AND "paymentStatus" = $2', [activeEditionId, 'PENDING']);
      console.log(`Pedidos PENDENTES na edição ativa: ${pendingOrdersResult.rows[0].count}`);
    } else {
      const allEditionsResult = await client.query('SELECT count(*) FROM editions');
      console.log(`Total de edições no banco: ${allEditionsResult.rows[0].count}`);
      
      const lastEditionResult = await client.query('SELECT id, name, active FROM editions ORDER BY "createdAt" DESC LIMIT 1');
      if (lastEditionResult.rows.length > 0) {
        console.log(`Última edição: ${lastEditionResult.rows[0].name} (Active: ${lastEditionResult.rows[0].active})`);
      }
    }

    const contributorsResult = await client.query('SELECT count(*) FROM contributors');
    console.log(`Total de colaboradores: ${contributorsResult.rows[0].count}`);

  } catch (err) {
    console.error('Erro na consulta:', err);
  } finally {
    await client.end();
  }
}

main();
