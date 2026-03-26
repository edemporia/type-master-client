import type { SQLiteDatabase } from 'expo-sqlite';
import { runMigrations } from './migrations';

export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  await runMigrations(db);
}
