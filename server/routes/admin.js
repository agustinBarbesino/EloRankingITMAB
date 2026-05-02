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
    if (email) {
      const existingEmail = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
      if (existingEmail) {
        return res.status(409).json({ error: 'Ese email ya está registrado.' });
      }
    }

    const userId = Date.now().toString();
    const displayName = firstName && lastName ? `${firstName} ${lastName}` : name;

    await run(
      `INSERT INTO users (id, email, name, password, role, first_name, last_name, course_year, course_division, verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)`,
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
    console.error('[ADMIN UPDATE ERROR]', err.message);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ese nombre o email ya existe.' });
    }
    res.status(500).json({ error: 'Error interno del servidor: ' + err.message });
  }
});

router.put('/users/:id', authenticate, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { name, email, password, firstName, lastName, courseYear, courseDivision } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'El nombre es obligatorio.' });
  }

  try {
    const user = await queryOne('SELECT * FROM users WHERE id = $1', [id]);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const existingName = await queryOne('SELECT id FROM users WHERE name = $1 AND id != $2', [name, id]);
    if (existingName) {
      return res.status(409).json({ error: 'Ese nombre ya existe.' });
    }

    if (email) {
      const existingEmail = await queryOne('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
      if (existingEmail) {
        return res.status(409).json({ error: 'Ese email ya está registrado.' });
      }
    }

    const newEmail = email || user.email;
    const newFirstName = firstName !== undefined ? firstName : user.first_name;
    const newLastName = lastName !== undefined ? lastName : user.last_name;
    const newCourseYear = courseYear !== undefined ? courseYear : user.course_year;
    const newCourseDivision = courseDivision !== undefined ? courseDivision : user.course_division;
    const displayName = newFirstName && newLastName ? `${newFirstName} ${newLastName}` : name;

    if (password) {
      await run(
        `UPDATE users SET email = $1, name = $2, password = $3, first_name = $4, last_name = $5,
         course_year = $6, course_division = $7 WHERE id = $8`,
        [newEmail, name, password, newFirstName, newLastName, newCourseYear, newCourseDivision, id]
      );
    } else {
      await run(
        `UPDATE users SET email = $1, name = $2, first_name = $3, last_name = $4,
         course_year = $5, course_division = $6 WHERE id = $7`,
        [newEmail, name, newFirstName, newLastName, newCourseYear, newCourseDivision, id]
      );
    }

    await run(
      `UPDATE players SET display_name = $1, first_name = $2, last_name = $3,
       course_year = $4, course_division = $5 WHERE user_id = $6`,
      [displayName, newFirstName, newLastName, newCourseYear, newCourseDivision, id]
    );

    res.json({ success: true, user: { id, name, email: newEmail, role: user.role } });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ese nombre o email ya existe.' });
    }
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

export default router;
