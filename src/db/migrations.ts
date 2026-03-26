import type { SQLiteDatabase } from 'expo-sqlite';

interface Migration {
  version: number;
  up: (db: SQLiteDatabase) => Promise<void>;
}

// Each migration runs once, in order. Never edit a released migration — add a new one.
const migrations: Migration[] = [
  {
    // Baseline: the full v1 schema
    version: 1,
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          full_name TEXT NOT NULL,
          nickname TEXT NOT NULL,
          avatar_config TEXT NOT NULL DEFAULT '{}',
          age INTEGER NOT NULL,
          school TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS campaigns (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          order_index INTEGER NOT NULL,
          total_stages INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS stages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
          title TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          order_index INTEGER NOT NULL,
          total_lessons INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS lessons (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          stage_id INTEGER NOT NULL REFERENCES stages(id),
          type TEXT NOT NULL CHECK(type IN ('video', 'typing', 'prompt')),
          title TEXT NOT NULL,
          content_ref TEXT NOT NULL,
          order_index INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS progress (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id),
          lesson_id INTEGER NOT NULL REFERENCES lessons(id),
          completed INTEGER NOT NULL DEFAULT 0,
          stars INTEGER NOT NULL DEFAULT 0,
          accuracy REAL NOT NULL DEFAULT 0,
          wpm REAL NOT NULL DEFAULT 0,
          completed_at TEXT,
          UNIQUE(user_id, lesson_id)
        );

        CREATE TABLE IF NOT EXISTS keystroke_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL,
          user_id INTEGER NOT NULL REFERENCES users(id),
          lesson_id INTEGER NOT NULL,
          expected_char TEXT NOT NULL,
          pressed_char TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          delay_ms INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS game_scores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id),
          game_type TEXT NOT NULL CHECK(game_type IN ('meteor', 'waterfall', 'balloon')),
          score INTEGER NOT NULL DEFAULT 0,
          accuracy REAL NOT NULL DEFAULT 0,
          wpm REAL NOT NULL DEFAULT 0,
          played_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS leaderboard (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id),
          test_id TEXT NOT NULL,
          score INTEGER NOT NULL DEFAULT 0,
          rank INTEGER NOT NULL DEFAULT 0,
          synced INTEGER NOT NULL DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);
        CREATE INDEX IF NOT EXISTS idx_progress_lesson ON progress(lesson_id);
        CREATE INDEX IF NOT EXISTS idx_keystroke_session ON keystroke_logs(session_id);
        CREATE INDEX IF NOT EXISTS idx_game_scores_user ON game_scores(user_id);
        CREATE INDEX IF NOT EXISTS idx_leaderboard_user ON leaderboard(user_id);
      `);
    },
  },
  {
    // v2: Add device_id for multi-device sync, add updated_at for conflict resolution
    version: 2,
    up: async (db) => {
      await db.execAsync(`
        ALTER TABLE users ADD COLUMN device_id TEXT;
        ALTER TABLE users ADD COLUMN updated_at TEXT DEFAULT (datetime('now'));
        ALTER TABLE progress ADD COLUMN updated_at TEXT DEFAULT (datetime('now'));
        ALTER TABLE game_scores ADD COLUMN synced INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE keystroke_logs ADD COLUMN synced INTEGER NOT NULL DEFAULT 0;
      `);
    },
  },
];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  // PRAGMA user_version tracks which migrations have been applied
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      await db.execAsync('BEGIN TRANSACTION');
      try {
        await migration.up(db);
        await db.execAsync(`PRAGMA user_version = ${migration.version}`);
        await db.execAsync('COMMIT');
      } catch (error) {
        await db.execAsync('ROLLBACK');
        throw new Error(`Migration v${migration.version} failed: ${error}`);
      }
    }
  }
}
