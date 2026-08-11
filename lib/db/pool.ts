import 'server-only';
import { Pool } from 'pg';

/**
 * Една връзка към Postgres за сървърния процес. Neon препоръчва
 * pooled connection string; в serverless среда държим пула малък.
 */
const globalForPool = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPool.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    ssl: process.env.DATABASE_URL?.includes('localhost') ||
      process.env.DATABASE_URL?.includes('127.0.0.1')
      ? undefined
      : { rejectUnauthorized: false },
  });

if (!globalForPool.pgPool) globalForPool.pgPool = pool;
