import NetInfo from '@react-native-community/netinfo';
import type { SQLiteDatabase } from 'expo-sqlite';

const API_BASE = 'https://api.typekids.app'; // TODO: configure per environment

interface SyncPayload {
  user_id: number;
  progress: any[];
  keystroke_logs: any[];
  game_scores: any[];
}

// Collect all unsynced local data and push to server
async function collectSyncData(db: SQLiteDatabase, userId: number): Promise<SyncPayload> {
  const progress = await db.getAllAsync<any>(
    'SELECT * FROM progress WHERE user_id = ?', [userId]
  );
  const keystrokeLogs = await db.getAllAsync<any>(
    'SELECT * FROM keystroke_logs WHERE user_id = ? ORDER BY id DESC LIMIT 500', [userId]
  );
  const gameScores = await db.getAllAsync<any>(
    'SELECT * FROM game_scores WHERE user_id = ? ORDER BY id DESC LIMIT 100', [userId]
  );

  return {
    user_id: userId,
    progress: progress.map(p => ({
      lesson_id: p.lesson_id,
      completed: !!p.completed,
      stars: p.stars,
      accuracy: p.accuracy,
      wpm: p.wpm,
      completed_at: p.completed_at,
    })),
    keystroke_logs: keystrokeLogs.map(l => ({
      session_id: l.session_id,
      lesson_id: l.lesson_id,
      expected_char: l.expected_char,
      pressed_char: l.pressed_char,
      timestamp: l.timestamp,
      delay_ms: l.delay_ms,
    })),
    game_scores: gameScores.map(g => ({
      game_type: g.game_type,
      score: g.score,
      accuracy: g.accuracy,
      wpm: g.wpm,
      played_at: g.played_at,
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

// Main sync function — call this when network becomes available
export async function performSync(db: SQLiteDatabase, userId: number): Promise<{ success: boolean }> {
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return { success: false };

  try {
    const payload = await collectSyncData(db, userId);
    const pushOk = await pushToServer(payload);
    if (pushOk) {
      await pullFromServer(userId, db);
    }
    return { success: pushOk };
  } catch {
    return { success: false };
  }
}

// Background sync listener — starts monitoring network and syncs when online
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
