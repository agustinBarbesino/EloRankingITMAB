import { Router } from 'express';
import { query, queryOne, run } from '../database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
  }

  try {
    const user = await queryOne('SELECT * FROM users WHERE email = $1', [email]);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        courseYear: user.course_year,
        courseDivision: user.course_division,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.post('/register', async (req, res) => {
  const { email, password, firstName, lastName, courseYear, courseDivision } = req.body;

  if (!email || !password || !firstName || !lastName || !courseYear) {
    return res.status(400).json({ error: 'Completá todos los campos obligatorios.' });
  }

  try {
    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) {
      return res.status(409).json({ error: 'Ese email ya está registrado.' });
    }

    const userId = Date.now().toString();
    const displayName = `${firstName} ${lastName}`;

    await run(
      `INSERT INTO users (id, email, name, password, role, first_name, last_name, course_year, course_division, verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)`,
      [userId, email, displayName, password, 'student', firstName, lastName, courseYear, courseDivision || null]
    );

    await run(
      `INSERT INTO players (id, user_id, display_name, first_name, last_name, role, course_year, course_division, rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [`${userId}-player`, userId, displayName, firstName, lastName, 'student', courseYear, courseDivision || null, 700]
    );

    res.status(201).json({
      success: true,
      message: 'Cuenta creada exitosamente.',
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ese email ya está registrado.' });
    }
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.get('/users', authenticate, async (req, res) => {
  try {
    const users = await query(`
      SELECT u.id, u.email, u.name, u.role, u.first_name, u.last_name, u.course_year, u.course_division, u.verified,
             COALESCE(p.rating, 700) as rating
      FROM users u
      LEFT JOIN players p ON u.id = p.user_id
      WHERE u.role != 'admin'
      ORDER BY u.name
    `);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.delete('/users/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  if (id === 'admin') {
    return res.status(400).json({ error: 'No se puede eliminar al administrador.' });
  }

  const client = await (await import('../database.js')).pool.connect();
  try {
    await client.query('BEGIN');

    const matchesRes = await client.query('DELETE FROM matches WHERE white_user_id = $1 OR black_user_id = $1', [id]);
    console.log(`[DELETE] Removed ${matchesRes.rowCount} matches for user ${id}`);

    const playersRes = await client.query('DELETE FROM players WHERE user_id = $1', [id]);
    console.log(`[DELETE] Removed ${playersRes.rowCount} players for user ${id}`);

    const usersRes = await client.query('DELETE FROM users WHERE id = $1', [id]);
    console.log(`[DELETE] Removed ${usersRes.rowCount} users for user ${id}`);

    if (usersRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`[DELETE ERROR] Failed to delete user ${id}:`, err.message);
    res.status(500).json({ error: 'Error al eliminar el usuario: ' + err.message });
  } finally {
    client.release();
  }
});

export default router;
