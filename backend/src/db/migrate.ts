import pool from './pool';

const migrations: { version: number; sql: string }[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        device_id TEXT UNIQUE,
        full_name TEXT NOT NULL,
        nickname TEXT NOT NULL,
        avatar_config JSONB NOT NULL DEFAULT '{}',
        age INTEGER NOT NULL,
        school TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        order_index INTEGER NOT NULL,
        total_stages INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS stages (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        order_index INTEGER NOT NULL,
        total_lessons INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS lessons (
        id SERIAL PRIMARY KEY,
        stage_id INTEGER NOT NULL REFERENCES stages(id),
        type TEXT NOT NULL CHECK(type IN ('video', 'typing', 'prompt')),
        title TEXT NOT NULL,
        content_ref TEXT NOT NULL,
        order_index INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        lesson_id INTEGER NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        stars INTEGER NOT NULL DEFAULT 0,
        accuracy REAL NOT NULL DEFAULT 0,
        wpm REAL NOT NULL DEFAULT 0,
        completed_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, lesson_id)
      );

      CREATE TABLE IF NOT EXISTS keystroke_logs (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id),
        lesson_id INTEGER NOT NULL,
        expected_char TEXT NOT NULL,
        pressed_char TEXT NOT NULL,
        timestamp BIGINT NOT NULL,
        delay_ms INTEGER NOT NULL DEFAULT 0,
        synced_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS game_scores (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        game_type TEXT NOT NULL CHECK(game_type IN ('meteor', 'waterfall', 'balloon')),
        score INTEGER NOT NULL DEFAULT 0,
        accuracy REAL NOT NULL DEFAULT 0,
        wpm REAL NOT NULL DEFAULT 0,
        played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, game_type, played_at)
      );

      CREATE TABLE IF NOT EXISTS leaderboard (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        test_id TEXT NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        rank INTEGER NOT NULL DEFAULT 0,
        synced_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);
      CREATE INDEX IF NOT EXISTS idx_progress_lesson ON progress(lesson_id);
      CREATE INDEX IF NOT EXISTS idx_keystroke_session ON keystroke_logs(session_id);
      CREATE INDEX IF NOT EXISTS idx_game_scores_user ON game_scores(user_id);
      CREATE INDEX IF NOT EXISTS idx_leaderboard_user ON leaderboard(user_id);
      CREATE INDEX IF NOT EXISTS idx_users_device ON users(device_id);
    `,
  },
];

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    // Ensure migration tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const { rows } = await client.query<{ version: number }>(
      'SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1'
    );
    const currentVersion = rows[0]?.version ?? 0;

    for (const migration of migrations) {
      if (migration.version > currentVersion) {
        await client.query('BEGIN');
        try {
          await client.query(migration.sql);
          await client.query(
            'INSERT INTO schema_migrations (version) VALUES ($1)',
            [migration.version]
          );
          await client.query('COMMIT');
          console.log(`Migration v${migration.version} applied`);
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        }
      }
    }
    console.log('Database migrations complete');
  } finally {
    client.release();
  }
}

// Run directly: npx ts-node src/db/migrate.ts
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });
}
