import { Router } from 'express';
import { query, queryOne, run } from '../database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { calculateNewRatings } from '../utils/eloCalculator.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    let matches;
    if (req.user.role === 'admin') {
      matches = await query('SELECT * FROM matches ORDER BY created_at DESC');
    } else {
      matches = await query(
        'SELECT * FROM matches WHERE white_user_id = $1 OR black_user_id = $1 ORDER BY created_at DESC',
        [req.user.id]
      );
    }
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.post('/', authenticate, requireRole('admin', 'teacher'), async (req, res) => {
  const { whiteUserId, blackUserId, result } = req.body;

  if (!whiteUserId || !blackUserId || !result) {
    return res.status(400).json({ error: 'Completá todos los campos.' });
  }

  if (whiteUserId === blackUserId) {
    return res.status(400).json({ error: 'Un jugador no puede jugar contra sí mismo.' });
  }

  if (!['white', 'black', 'draw'].includes(result)) {
    return res.status(400).json({ error: 'Resultado inválido.' });
  }

  try {
    const whitePlayer = await queryOne('SELECT * FROM players WHERE user_id = $1', [whiteUserId]);
    const blackPlayer = await queryOne('SELECT * FROM players WHERE user_id = $1', [blackUserId]);

    if (!whitePlayer || !blackPlayer) {
      return res.status(404).json({ error: 'Jugador no encontrado.' });
    }

    const { white: whiteResult, black: blackResult } = calculateNewRatings(
      whitePlayer.rating,
      blackPlayer.rating,
      result,
      whitePlayer.games_played,
      blackPlayer.games_played
    );

    const matchId = Date.now().toString();

    const client = await (await import('../database.js')).pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO matches (id, white_user_id, black_user_id, white_name, black_name, result)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [matchId, whiteUserId, blackUserId, whitePlayer.display_name, blackPlayer.display_name, result]
      );

      const whiteWin = result === 'white' ? 1 : 0;
      const whiteLoss = result === 'black' ? 1 : 0;
      const whiteDraw = result === 'draw' ? 1 : 0;
      await client.query(
        `UPDATE players SET rating = $1, games_played = games_played + 1,
          wins = wins + $2, losses = losses + $3, draws = draws + $4
         WHERE user_id = $5`,
        [whiteResult.newRating, whiteWin, whiteLoss, whiteDraw, whiteUserId]
      );

      const blackWin = result === 'black' ? 1 : 0;
      const blackLoss = result === 'white' ? 1 : 0;
      const blackDraw = result === 'draw' ? 1 : 0;
      await client.query(
        `UPDATE players SET rating = $1, games_played = games_played + 1,
          wins = wins + $2, losses = losses + $3, draws = draws + $4
         WHERE user_id = $5`,
        [blackResult.newRating, blackWin, blackLoss, blackDraw, blackUserId]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    const players = await query('SELECT * FROM players ORDER BY rating DESC');
    res.json({
      success: true,
      white: whiteResult,
      black: blackResult,
      ranking: players,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

export default router;
