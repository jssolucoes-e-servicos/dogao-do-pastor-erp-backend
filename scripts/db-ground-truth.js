// scripts/db-ground-truth.js
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not found in .env');
    return;
  }

  const pool = new Pool({ connectionString });

  try {
    // 1. Procurar o usuário
    console.log('--- Buscando usuário jacksonsantos ---');
    const userRes = await pool.query('SELECT id, name, username, active FROM contributors WHERE username = $1', ['jacksonsantos']);
    if (userRes.rows.length === 0) {
      console.log('ERRO: Usuário jacksonsantos NÃO encontrado.');
      return;
    }
    const user = userRes.rows[0];
    console.log('ID:', user.id);
    console.log('Ativo:', user.active);

    // 2. Buscar Roles do usuário
    console.log('\n--- Buscando Roles do usuário ---');
    const rolesRes = await pool.query(`
      SELECT r.id, r.name, r.active as role_active, ur.active as link_active
      FROM roles r
      JOIN user_roles ur ON r.id = ur."roleId"
      WHERE ur."contributorId" = $1
    `, [user.id]);

    if (rolesRes.rows.length === 0) {
      console.log('AVISO: O usuário não possui NENHUMA role associada.');
    } else {
      rolesRes.rows.forEach(r => {
        console.log(`- Role: ${r.name} (ID: ${r.id}) | Role Ativa: ${r.role_active} | Vínculo Ativo: ${r.link_active}`);
      });
    }

    // 3. Listar todas as roles do sistema para conferir nomes
    console.log('\n--- Todas as Roles cadastradas ---');
    const allRolesRes = await pool.query('SELECT id, name FROM roles');
    allRolesRes.rows.forEach(r => {
      console.log(`- ${r.name} (${r.id})`);
    });

  } catch (error) {
    console.error('ERRO AO CONSULTAR BANCO:', error);
  } finally {
    await pool.end();
  }
}

main();
