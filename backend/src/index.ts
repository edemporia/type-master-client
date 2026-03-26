import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { runMigrations } from './db/migrate';
import userRoutes from './routes/users';
import syncRoutes from './routes/sync';
import leaderboardRoutes from './routes/leaderboard';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

async function start() {
  await runMigrations();
  app.listen(PORT, () => {
    console.log(`TypeKids API running on port ${PORT}`);
  });
}

start().catch(console.error);
