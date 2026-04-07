import 'dotenv/config';
import { createApp } from './app';
import { env } from './config/env';
import { pool, checkDbConnection } from './db/pool';

async function start(): Promise<void> {
  // Verify DB is reachable before accepting traffic
  try {
    await checkDbConnection();
    console.log('✅  Database connected');
  } catch (err) {
    console.error('❌  Database connection failed:', err);
    process.exit(1);
  }

  const app    = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`🚀  Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n${signal} received — shutting down gracefully...`);

    server.close(async () => {
      console.log('HTTP server closed');
      await pool.end();
      console.log('Database pool closed');
      process.exit(0);
    });

    // Force-kill after 10 s if still hanging
    setTimeout(() => {
      console.error('Forcing shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  process.on('uncaughtException',  (err) => {
    console.error('Uncaught exception:', err);
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
    process.exit(1);
  });
}

start();
