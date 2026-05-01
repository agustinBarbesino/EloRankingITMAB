import { Router } from 'express';
import { query, queryOne } from '../database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/ranking', authenticate, async (_req, res) => {
  try {
    const players = await query('SELECT * FROM players ORDER BY rating DESC');
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const player = await queryOne('SELECT * FROM players WHERE user_id = $1', [req.user.id]);
    if (!player) {
      return res.status(404).json({ error: 'Jugador no encontrado.' });
    }
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

export default router;
