import { Router, Request, Response } from 'express';
import pool from '../db/pool';

const router = Router();

// POST /api/users — upsert user by device_id
router.post('/', async (req: Request, res: Response) => {
  const { device_id, full_name, nickname, avatar_config, age, school } = req.body;

  if (!device_id || !full_name || !nickname || !age) {
    res.status(400).json({ error: 'Missing required fields: device_id, full_name, nickname, age' });
    return;
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO users (device_id, full_name, nickname, avatar_config, age, school, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (device_id) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         nickname = EXCLUDED.nickname,
         avatar_config = EXCLUDED.avatar_config,
         age = EXCLUDED.age,
         school = EXCLUDED.school,
         updated_at = NOW()
       RETURNING *`,
      [device_id, full_name, nickname, JSON.stringify(avatar_config || {}), age, school || null]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('User upsert error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:deviceId
router.get('/:deviceId', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE device_id = $1',
      [req.params.deviceId]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('User fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
