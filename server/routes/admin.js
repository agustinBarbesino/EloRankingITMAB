import { Router } from 'express';
import { queryOne, run } from '../database.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/users', authenticate, requireRole('admin'), async (req, res) => {
  const { name, email, password, role, firstName, lastName, courseYear, courseDivision } = req.body;

  if (!name || !password || !role) {
    return res.status(400).json({ error: 'Completá los campos obligatorios.' });
  }

  if (!['teacher', 'student'].includes(role)) {
    return res.status(400).json({ error: 'Rol inválido.' });
  }

  try {
    const existingName = await queryOne('SELECT id FROM users WHERE name = $1', [name]);
    if (existingName) {
      return res.status(409).json({ error: 'Ese nombre ya existe.' });
    }

    if (email) {
      const existingEmail = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
      if (existingEmail) {
        return res.status(409).json({ error: 'Ese email ya está registrado.' });
      }
    }

    const userId = Date.now().toString();
    const displayName = firstName && lastName ? `${firstName} ${lastName}` : name;

    await run(
      `INSERT INTO users (id, email, name, password, role, first_name, last_name, course_year, course_division)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [userId, email || null, name, password, role, firstName || null, lastName || null, courseYear || null, courseDivision || null]
    );

    await run(
      `INSERT INTO players (id, user_id, display_name, first_name, last_name, role, course_year, course_division, rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [`${userId}-player`, userId, displayName, firstName || null, lastName || null, role, courseYear || null, courseDivision || null, 700]
    );

    res.status(201).json({
      success: true,
      user: { id: userId, name, role },
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ese nombre o email ya existe.' });
    }
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

export default router;
