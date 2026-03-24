import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';
import { initDatabase } from '../db/schema';
import { seedDatabase } from '../data/campaigns';
import { getFirstUser } from '../db/repository';
import type { User } from '../types';

interface DatabaseContextValue {
  db: SQLite.SQLiteDatabase;
  user: User | null;
  setUser: (user: User | null) => void;
  isReady: boolean;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const db = SQLite.openDatabaseSync('typekids.db');
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      await initDatabase(db);
      await seedDatabase(db);
      const existingUser = await getFirstUser(db);
      if (existingUser) setUser(existingUser);
      setIsReady(true);
    })();
  }, []);

  if (!isReady) return null;

  return (
    <DatabaseContext.Provider value={{ db, user, setUser, isReady }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error('useDatabase must be used within DatabaseProvider');
  return ctx;
}
