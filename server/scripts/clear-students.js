import pkg from 'pg';
const { Pool } = pkg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL is not set.');
  console.error('Usage: DATABASE_URL="postgres://..." node scripts/clear-students.js');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('Contando estudiantes actuales...');
    const count = await client.query('SELECT COUNT(*) FROM users WHERE role = $1', ['student']);
    console.log(`Estudiantes encontrados: ${count.rows[0].count}`);

    if (parseInt(count.rows[0].count) === 0) {
      console.log('No hay estudiantes para borrar.');
      return;
    }

    console.log('\nEliminando estudiantes y registros relacionados...');
    const res = await client.query(
      `DELETE FROM users WHERE role = $1`,
      ['student']
    );
    console.log(`\nEstudiantes eliminados: ${res.rowCount}`);

    console.log('\nVerificación final:');
    const remaining = await client.query('SELECT COUNT(*) FROM users WHERE role = $1', ['student']);
    console.log(`Estudiantes restantes: ${remaining.rows[0].count}`);

    const usersLeft = await client.query('SELECT id, email, role FROM users');
    console.log('\nUsuarios restantes en la base:');
    usersLeft.rows.forEach((u) => console.log(`  ${u.role}: ${u.email} (${u.id})`));
  } finally {
    client.release();
    await pool.end();
  }
}

main();
