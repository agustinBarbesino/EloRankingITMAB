import { Router } from 'express';
import { query, queryOne, run } from '../database.js';
import { authenticate } from '../middleware/auth.js';
import { generateToken, sendVerificationEmail } from '../utils/emailService.js';

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

    if (user.role === 'student' && !user.verified) {
      return res.status(403).json({
        error: 'Tu cuenta no está verificada. Revisá tu email para confirmar tu registro.',
        needsVerification: true,
        email: user.email,
      });
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
        verified: user.verified,
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
    const verificationToken = generateToken();

    await run(
      `INSERT INTO users (id, email, name, password, role, first_name, last_name, course_year, course_division, verification_token)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [userId, email, displayName, password, 'student', firstName, lastName, courseYear, courseDivision || null, verificationToken]
    );

    await run(
      `INSERT INTO players (id, user_id, display_name, first_name, last_name, role, course_year, course_division, rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [`${userId}-player`, userId, displayName, firstName, lastName, 'student', courseYear, courseDivision || null, 700]
    );

    const emailResult = await sendVerificationEmail(email, firstName, verificationToken);
    const APP_URL = process.env.APP_URL || 'http://localhost:5173';
    const verifyUrl = `${APP_URL}/verify?token=${verificationToken}`;

    res.status(201).json({
      success: true,
      message: 'Cuenta creada. Revisá tu email para confirmarla.',
      email: email,
      verifyUrl,
      emailSent: emailResult.success,
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ese email ya está registrado.' });
    }
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'El email es obligatorio.' });
  }

  try {
    const user = await queryOne('SELECT * FROM users WHERE email = $1', [email]);
    if (!user) {
      return res.status(404).json({ error: 'No se encontró una cuenta con ese email.' });
    }

    if (user.verified) {
      return res.status(400).json({ error: 'Tu cuenta ya está verificada. Podés iniciar sesión.' });
    }

    const newToken = generateToken();
    await run('UPDATE users SET verification_token = $1 WHERE id = $2', [newToken, user.id]);

    const APP_URL = process.env.APP_URL || 'http://localhost:5173';
    const verifyUrl = `${APP_URL}/verify?token=${newToken}`;

    const result = await sendVerificationEmail(user.email, user.first_name || user.name, newToken);

    if (result.success) {
      res.json({ success: true, message: 'Email de verificación reenviado.', verifyUrl, emailSent: true });
    } else {
      res.json({ success: true, message: 'Token generado. Usá el enlace de abajo para verificar.', verifyUrl, emailSent: false });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.post('/verify', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token de verificación requerido.' });
  }

  try {
    const user = await queryOne('SELECT id, email, first_name FROM users WHERE verification_token = $1 AND verified = FALSE', [token]);
    if (!user) {
      return res.status(400).json({ error: 'Token inválido o cuenta ya verificada.' });
    }

    await run(
      'UPDATE users SET verified = TRUE, verification_token = NULL WHERE id = $1',
      [user.id]
    );

    res.json({
      success: true,
      message: '¡Cuenta verificada exitosamente! Ya podés iniciar sesión.',
    });
  } catch (err) {
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
