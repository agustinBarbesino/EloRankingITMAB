import pkg from 'pg';
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Please provide a PostgreSQL connection string.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
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
        verified BOOLEAN DEFAULT FALSE,
        verification_token TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
        white_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        black_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        white_name TEXT NOT NULL,
        black_name TEXT NOT NULL,
        result TEXT NOT NULL CHECK(result IN ('white', 'black', 'draw')),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT;
    `);

    try {
      await client.query(`
        ALTER TABLE players DROP CONSTRAINT IF EXISTS players_user_id_fkey;
        ALTER TABLE players ADD CONSTRAINT players_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      `);
    } catch (e) {
      console.warn('WARN: Could not update players FK constraint:', e.message);
    }

    try {
      await client.query(`
        ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_white_user_id_fkey;
        ALTER TABLE matches ADD CONSTRAINT matches_white_user_id_fkey FOREIGN KEY (white_user_id) REFERENCES users(id) ON DELETE CASCADE;
      `);
    } catch (e) {
      console.warn('WARN: Could not update matches white FK constraint:', e.message);
    }

    try {
      await client.query(`
        ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_black_user_id_fkey;
        ALTER TABLE matches ADD CONSTRAINT matches_black_user_id_fkey FOREIGN KEY (black_user_id) REFERENCES users(id) ON DELETE CASCADE;
      `);
    } catch (e) {
      console.warn('WARN: Could not update matches black FK constraint:', e.message);
    }

    console.log('Database initialized.');
  } catch (err) {
    console.error('Database init error:', err.message);
    throw err;
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
        `INSERT INTO users (id, email, name, password, role, first_name, last_name, course_year, course_division, verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)`,
        ['admin', 'agustinbarbesino@gmail.com', 'Administrador', '67Sist2187', 'admin', null, null, null, null]
      );
      await client.query(
        `INSERT INTO players (id, user_id, display_name, first_name, last_name, role, course_year, course_division, rating)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        ['admin-player', 'admin', 'Administrador', null, null, 'admin', null, null, 700]
      );
      console.log('Admin user created.');
    } else {
      await client.query(
        `UPDATE users SET email = $1, password = $2, verified = TRUE WHERE id = $3`,
        ['agustinbarbesino@gmail.com', '67Sist2187', 'admin']
      );
      console.log('Admin credentials updated.');
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
