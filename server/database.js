import pkg from 'pg';
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Please provide a PostgreSQL connection string.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        name TEXT,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'teacher', 'student')),
        first_name TEXT,
        last_name TEXT,
        course_year TEXT,
        course_division TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL REFERENCES users(id),
        display_name TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        role TEXT NOT NULL,
        course_year TEXT,
        course_division TEXT,
        rating INTEGER NOT NULL DEFAULT 700,
        games_played INTEGER NOT NULL DEFAULT 0,
        wins INTEGER NOT NULL DEFAULT 0,
        losses INTEGER NOT NULL DEFAULT 0,
        draws INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        white_user_id TEXT NOT NULL REFERENCES users(id),
        black_user_id TEXT NOT NULL REFERENCES users(id),
        white_name TEXT NOT NULL,
        black_name TEXT NOT NULL,
        result TEXT NOT NULL CHECK(result IN ('white', 'black', 'draw')),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Database initialized.');
  } finally {
    client.release();
  }
}

async function seedAdmin() {
  const client = await pool.connect();
  try {
    const existing = await client.query('SELECT id FROM users WHERE id = $1', ['admin']);
    if (existing.rows.length === 0) {
      await client.query(
        `INSERT INTO users (id, email, name, password, role, first_name, last_name, course_year, course_division)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        ['admin', 'admin@itmab.local', 'Administrador', 'itmab2026', 'admin', null, null, null, null]
      );
      await client.query(
        `INSERT INTO players (id, user_id, display_name, first_name, last_name, role, course_year, course_division, rating)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        ['admin-player', 'admin', 'Administrador', null, null, 'admin', null, null, 700]
      );
      console.log('Admin user created.');
    }
  } finally {
    client.release();
  }
}

async function query(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}

async function queryOne(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows[0] || null;
}

async function run(sql, params = []) {
  return pool.query(sql, params);
}

export { pool, initDB, seedAdmin, query, queryOne, run };
