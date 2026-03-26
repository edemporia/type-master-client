import NetInfo from '@react-native-community/netinfo';
import type { SQLiteDatabase } from 'expo-sqlite';

// Configure this to your backend URL
// For local dev: 'http://10.49.19.56:3000' (your PC's IP)
// For production: 'https://api.typekids.app'
const API_BASE = 'https://api.typekids.app';

interface SyncPayload {
  userId: number;
  deviceId: string;
  progress: any[];
  keystrokeLogs: any[];
  gameScores: any[];
}

// Collect unsynced local data
async function collectSyncData(db: SQLiteDatabase, userId: number): Promise<SyncPayload> {
  // Get device_id from user
  const user = await db.getFirstAsync<any>(
    'SELECT device_id FROM users WHERE id = ?', [userId]
  );

  const progress = await db.getAllAsync<any>(
    'SELECT * FROM progress WHERE user_id = ?', [userId]
  );

  // Only push unsynced keystroke logs
  const keystrokeLogs = await db.getAllAsync<any>(
    'SELECT * FROM keystroke_logs WHERE user_id = ? AND synced = 0 ORDER BY id DESC LIMIT 500',
    [userId]
  );

  // Only push unsynced game scores
  const gameScores = await db.getAllAsync<any>(
    'SELECT * FROM game_scores WHERE user_id = ? AND synced = 0 ORDER BY id DESC LIMIT 100',
    [userId]
  );

  return {
    userId,
    deviceId: user?.device_id || '',
    progress: progress.map(p => ({
      lessonId: p.lesson_id,
      completed: !!p.completed,
      stars: p.stars,
      accuracy: p.accuracy,
      wpm: p.wpm,
      completedAt: p.completed_at,
    })),
    keystrokeLogs: keystrokeLogs.map(l => ({
      sessionId: l.session_id,
      lessonId: l.lesson_id,
      expectedChar: l.expected_char,
      pressedChar: l.pressed_char,
      timestamp: l.timestamp,
      delayMs: l.delay_ms,
    })),
    gameScores: gameScores.map(g => ({
      gameType: g.game_type,
      score: g.score,
      accuracy: g.accuracy,
      wpm: g.wpm,
      playedAt: g.played_at,
    })),
  };
}

async function pushToServer(payload: SyncPayload): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function pullFromServer(userId: number, db: SQLiteDatabase): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/sync/pull/${userId}`);
    if (!response.ok) return false;

    const data = await response.json();

    // Merge server progress (keep best stars)
    for (const p of data.progress || []) {
      await db.runAsync(
        `INSERT INTO progress (user_id, lesson_id, completed, stars, accuracy, wpm, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, lesson_id) DO UPDATE SET
           stars = MAX(progress.stars, excluded.stars),
           completed = CASE WHEN excluded.stars > progress.stars THEN excluded.completed ELSE progress.completed END,
           accuracy = CASE WHEN excluded.stars > progress.stars THEN excluded.accuracy ELSE progress.accuracy END,
           wpm = MAX(progress.wpm, excluded.wpm)`,
        [userId, p.lesson_id, p.completed ? 1 : 0, p.stars, p.accuracy, p.wpm, p.completed_at]
      );
    }

    return true;
  } catch {
    return false;
  }
}

// Mark records as synced after successful push
async function markAsSynced(db: SQLiteDatabase, userId: number): Promise<void> {
  await db.runAsync('UPDATE keystroke_logs SET synced = 1 WHERE user_id = ? AND synced = 0', [userId]);
  await db.runAsync('UPDATE game_scores SET synced = 1 WHERE user_id = ? AND synced = 0', [userId]);
}

// Main sync function — call when network becomes available
export async function performSync(db: SQLiteDatabase, userId: number): Promise<{ success: boolean }> {
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return { success: false };

  try {
    const payload = await collectSyncData(db, userId);
    const pushOk = await pushToServer(payload);
    if (pushOk) {
      await markAsSynced(db, userId);
      await pullFromServer(userId, db);
    }
    return { success: pushOk };
  } catch {
    return { success: false };
  }
}

// Background sync listener — monitors network and syncs when online
let unsubscribe: (() => void) | null = null;

export function startBackgroundSync(db: SQLiteDatabase, userId: number): void {
  if (unsubscribe) return; // Already running

  unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected) {
      performSync(db, userId);
    }
  });
}

export function stopBackgroundSync(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}
