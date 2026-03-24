import type { SQLiteDatabase } from 'expo-sqlite';
import type { User, Campaign, Stage, Lesson, Progress, KeystrokeLog, GameScore } from '../types';

// ─── Users ──────────────────────────────────────
export async function createUser(db: SQLiteDatabase, user: Omit<User, 'id' | 'createdAt'>): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO users (full_name, nickname, avatar_config, age, school) VALUES (?, ?, ?, ?, ?)',
    [user.fullName, user.nickname, user.avatarConfig, user.age, user.school]
  );
  return result.lastInsertRowId;
}

export async function getUser(db: SQLiteDatabase, id: number): Promise<User | null> {
  const row = await db.getFirstAsync<any>('SELECT * FROM users WHERE id = ?', [id]);
  if (!row) return null;
  return mapUser(row);
}

export async function getFirstUser(db: SQLiteDatabase): Promise<User | null> {
  const row = await db.getFirstAsync<any>('SELECT * FROM users ORDER BY id LIMIT 1');
  if (!row) return null;
  return mapUser(row);
}

function mapUser(row: any): User {
  return {
    id: row.id,
    fullName: row.full_name,
    nickname: row.nickname,
    avatarConfig: row.avatar_config,
    age: row.age,
    school: row.school,
    createdAt: row.created_at,
  };
}

// ─── Campaigns ──────────────────────────────────
export async function getCampaigns(db: SQLiteDatabase): Promise<Campaign[]> {
  const rows = await db.getAllAsync<any>('SELECT * FROM campaigns ORDER BY order_index');
  return rows.map(r => ({
    id: r.id, title: r.title, description: r.description,
    orderIndex: r.order_index, totalStages: r.total_stages,
  }));
}

// ─── Stages ─────────────────────────────────────
export async function getStages(db: SQLiteDatabase, campaignId: number): Promise<Stage[]> {
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM stages WHERE campaign_id = ? ORDER BY order_index', [campaignId]
  );
  return rows.map(r => ({
    id: r.id, campaignId: r.campaign_id, title: r.title, description: r.description,
    orderIndex: r.order_index, totalLessons: r.total_lessons,
  }));
}

// ─── Lessons ────────────────────────────────────
export async function getLessons(db: SQLiteDatabase, stageId: number): Promise<Lesson[]> {
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM lessons WHERE stage_id = ? ORDER BY order_index', [stageId]
  );
  return rows.map(r => ({
    id: r.id, stageId: r.stage_id, type: r.type, title: r.title,
    contentRef: r.content_ref, orderIndex: r.order_index,
  }));
}

export async function getLesson(db: SQLiteDatabase, id: number): Promise<Lesson | null> {
  const row = await db.getFirstAsync<any>('SELECT * FROM lessons WHERE id = ?', [id]);
  if (!row) return null;
  return {
    id: row.id, stageId: row.stage_id, type: row.type, title: row.title,
    contentRef: row.content_ref, orderIndex: row.order_index,
  };
}

// ─── Progress ───────────────────────────────────
export async function getProgress(db: SQLiteDatabase, userId: number, lessonId: number): Promise<Progress | null> {
  const row = await db.getFirstAsync<any>(
    'SELECT * FROM progress WHERE user_id = ? AND lesson_id = ?', [userId, lessonId]
  );
  if (!row) return null;
  return mapProgress(row);
}

export async function getUserProgress(db: SQLiteDatabase, userId: number): Promise<Progress[]> {
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM progress WHERE user_id = ?', [userId]
  );
  return rows.map(mapProgress);
}

export async function saveProgress(
  db: SQLiteDatabase,
  p: { userId: number; lessonId: number; completed: boolean; stars: number; accuracy: number; wpm: number }
): Promise<void> {
  await db.runAsync(
    `INSERT INTO progress (user_id, lesson_id, completed, stars, accuracy, wpm, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(user_id, lesson_id) DO UPDATE SET
       completed = CASE WHEN excluded.stars > progress.stars THEN excluded.completed ELSE progress.completed END,
       stars = MAX(progress.stars, excluded.stars),
       accuracy = CASE WHEN excluded.stars > progress.stars THEN excluded.accuracy ELSE progress.accuracy END,
       wpm = CASE WHEN excluded.wpm > progress.wpm THEN excluded.wpm ELSE progress.wpm END,
       completed_at = CASE WHEN excluded.stars > progress.stars THEN excluded.completed_at ELSE progress.completed_at END`,
    [p.userId, p.lessonId, p.completed ? 1 : 0, p.stars, p.accuracy, p.wpm]
  );
}

// Check if all lessons in a stage are completed with enough stars
export async function isStageCompleted(db: SQLiteDatabase, userId: number, stageId: number): Promise<boolean> {
  const row = await db.getFirstAsync<any>(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN p.completed = 1 AND p.stars >= 4 THEN 1 ELSE 0 END) as passed
     FROM lessons l
     LEFT JOIN progress p ON p.lesson_id = l.id AND p.user_id = ?
     WHERE l.stage_id = ?`,
    [userId, stageId]
  );
  if (!row || row.total === 0) return false;
  return row.passed >= row.total;
}

// Get completion stats for a stage (how many lessons completed out of total)
export async function getStageCompletionStats(
  db: SQLiteDatabase, userId: number, stageId: number
): Promise<{ total: number; completed: number; avgStars: number }> {
  const row = await db.getFirstAsync<any>(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN p.completed = 1 THEN 1 ELSE 0 END) as completed,
       COALESCE(AVG(CASE WHEN p.stars > 0 THEN p.stars END), 0) as avg_stars
     FROM lessons l
     LEFT JOIN progress p ON p.lesson_id = l.id AND p.user_id = ?
     WHERE l.stage_id = ?`,
    [userId, stageId]
  );
  return {
    total: row?.total || 0,
    completed: row?.completed || 0,
    avgStars: Math.round((row?.avg_stars || 0) * 10) / 10,
  };
}

// Save leaderboard entry
export async function saveLeaderboardEntry(
  db: SQLiteDatabase, entry: { userId: number; testId: string; score: number }
): Promise<void> {
  await db.runAsync(
    'INSERT INTO leaderboard (user_id, test_id, score, rank, synced) VALUES (?, ?, ?, 0, 0)',
    [entry.userId, entry.testId, entry.score]
  );
}

// Get leaderboard entries
export async function getLeaderboard(db: SQLiteDatabase): Promise<Array<{
  nickname: string; avatarConfig: string; score: number; testId: string
}>> {
  const rows = await db.getAllAsync<any>(
    `SELECT u.nickname, u.avatar_config, l.score, l.test_id
     FROM leaderboard l
     JOIN users u ON u.id = l.user_id
     ORDER BY l.score DESC
     LIMIT 50`
  );
  return rows.map(r => ({
    nickname: r.nickname,
    avatarConfig: r.avatar_config,
    score: r.score,
    testId: r.test_id,
  }));
}

function mapProgress(row: any): Progress {
  return {
    id: row.id, userId: row.user_id, lessonId: row.lesson_id,
    completed: !!row.completed, stars: row.stars, accuracy: row.accuracy,
    wpm: row.wpm, completedAt: row.completed_at,
  };
}

// ─── Keystroke Logs ─────────────────────────────
export async function saveKeystrokeBatch(db: SQLiteDatabase, logs: Omit<KeystrokeLog, 'id'>[]): Promise<void> {
  if (logs.length === 0) return;
  const placeholders = logs.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(',');
  const values = logs.flatMap(l => [
    l.sessionId, l.userId, l.lessonId, l.expectedChar, l.pressedChar, l.timestamp, l.delayMs,
  ]);
  await db.runAsync(
    `INSERT INTO keystroke_logs (session_id, user_id, lesson_id, expected_char, pressed_char, timestamp, delay_ms) VALUES ${placeholders}`,
    values
  );
}

// ─── Game Scores ────────────────────────────────
export async function saveGameScore(db: SQLiteDatabase, score: Omit<GameScore, 'id' | 'playedAt'>): Promise<void> {
  await db.runAsync(
    'INSERT INTO game_scores (user_id, game_type, score, accuracy, wpm) VALUES (?, ?, ?, ?, ?)',
    [score.userId, score.gameType, score.score, score.accuracy, score.wpm]
  );
}

export async function getGameScores(db: SQLiteDatabase, userId: number, gameType?: string): Promise<GameScore[]> {
  const query = gameType
    ? 'SELECT * FROM game_scores WHERE user_id = ? AND game_type = ? ORDER BY score DESC LIMIT 20'
    : 'SELECT * FROM game_scores WHERE user_id = ? ORDER BY played_at DESC LIMIT 50';
  const params = gameType ? [userId, gameType] : [userId];
  const rows = await db.getAllAsync<any>(query, params);
  return rows.map(r => ({
    id: r.id, userId: r.user_id, gameType: r.game_type,
    score: r.score, accuracy: r.accuracy, wpm: r.wpm, playedAt: r.played_at,
  }));
}
