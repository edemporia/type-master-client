import { Router, Request, Response } from 'express';
import pool from '../db/pool';

const router = Router();

// POST /api/sync/push — receive bulk data from client
router.post('/push', async (req: Request, res: Response) => {
  const { userId, deviceId, progress, keystrokeLogs, gameScores } = req.body;

  if (!userId || !deviceId) {
    res.status(400).json({ error: 'Missing userId or deviceId' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Upsert progress — keep best stars and best WPM
    if (progress?.length) {
      for (const p of progress) {
        await client.query(
          `INSERT INTO progress (user_id, lesson_id, completed, stars, accuracy, wpm, completed_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           ON CONFLICT (user_id, lesson_id) DO UPDATE SET
             completed = GREATEST(progress.completed::int, EXCLUDED.completed::int)::boolean,
             stars = GREATEST(progress.stars, EXCLUDED.stars),
             accuracy = GREATEST(progress.accuracy, EXCLUDED.accuracy),
             wpm = GREATEST(progress.wpm, EXCLUDED.wpm),
             completed_at = COALESCE(EXCLUDED.completed_at, progress.completed_at),
             updated_at = NOW()`,
          [userId, p.lessonId, p.completed, p.stars, p.accuracy, p.wpm, p.completedAt || null]
        );
      }
    }

    // Insert keystroke logs — deduplicate by session + timestamp + expected char
    if (keystrokeLogs?.length) {
      for (const k of keystrokeLogs) {
        await client.query(
          `INSERT INTO keystroke_logs (session_id, user_id, lesson_id, expected_char, pressed_char, timestamp, delay_ms)
           SELECT $1, $2, $3, $4, $5, $6, $7
           WHERE NOT EXISTS (
             SELECT 1 FROM keystroke_logs
             WHERE session_id = $1 AND timestamp = $6 AND expected_char = $4
           )`,
          [k.sessionId, userId, k.lessonId, k.expectedChar, k.pressedChar, k.timestamp, k.delayMs]
        );
      }
    }

    // Insert game scores — deduplicate by user + game_type + played_at
    if (gameScores?.length) {
      for (const g of gameScores) {
        await client.query(
          `INSERT INTO game_scores (user_id, game_type, score, accuracy, wpm, played_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (user_id, game_type, played_at) DO NOTHING`,
          [userId, g.gameType, g.score, g.accuracy, g.wpm, g.playedAt]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Sync push error:', err);
    res.status(500).json({ error: 'Sync push failed' });
  } finally {
    client.release();
  }
});

// GET /api/sync/pull/:userId — return server data for client merge
router.get('/pull/:userId', async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: 'Invalid userId' });
    return;
  }

  try {
    const progressResult = await pool.query(
      'SELECT lesson_id, completed, stars, accuracy, wpm, completed_at FROM progress WHERE user_id = $1',
      [userId]
    );
    const scoresResult = await pool.query(
      'SELECT game_type, score, accuracy, wpm, played_at FROM game_scores WHERE user_id = $1 ORDER BY played_at DESC LIMIT 100',
      [userId]
    );

    res.json({
      progress: progressResult.rows,
      gameScores: scoresResult.rows,
    });
  } catch (err) {
    console.error('Sync pull error:', err);
    res.status(500).json({ error: 'Sync pull failed' });
  }
});

export default router;
