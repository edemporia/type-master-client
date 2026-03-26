import { Router, Request, Response } from 'express';
import pool from '../db/pool';

const router = Router();

// GET /api/leaderboard — top scores across all users
router.get('/', async (req: Request, res: Response) => {
  const gameType = req.query.game_type as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

  try {
    let query: string;
    let params: any[];

    if (gameType) {
      query = `
        SELECT gs.id, gs.score, gs.accuracy, gs.wpm, gs.game_type, gs.played_at,
               u.nickname, u.avatar_config
        FROM game_scores gs
        JOIN users u ON u.id = gs.user_id
        WHERE gs.game_type = $1
        ORDER BY gs.score DESC
        LIMIT $2`;
      params = [gameType, limit];
    } else {
      query = `
        SELECT gs.id, gs.score, gs.accuracy, gs.wpm, gs.game_type, gs.played_at,
               u.nickname, u.avatar_config
        FROM game_scores gs
        JOIN users u ON u.id = gs.user_id
        ORDER BY gs.score DESC
        LIMIT $1`;
      params = [limit];
    }

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
