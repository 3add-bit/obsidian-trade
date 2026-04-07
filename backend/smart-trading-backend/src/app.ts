import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

import authRoutes      from './modules/auth/auth.routes';
import tradingRoutes   from './modules/trading/trading.routes';
import portfolioRoutes from './modules/portfolio/portfolio.routes';

export function createApp(): Application {
  const app = express();

  // ── Security ────────────────────────────────────────────────────────────────
  app.use(helmet());
  app.set('trust proxy', 1);

  app.use(
    cors({
      origin: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // ── Global rate limiting ────────────────────────────────────────────────────
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, error: 'Too many auth attempts, please try again later.' },
  });

  const tradeLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    message: { success: false, error: 'Trade rate limit exceeded.' },
  });

  app.use(globalLimiter);

  // ── Parsing & compression ───────────────────────────────────────────────────
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(compression());

  // ── Logging ─────────────────────────────────────────────────────────────────
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // ── Health check ────────────────────────────────────────────────────────────
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', env: env.NODE_ENV, timestamp: new Date().toISOString() });
  });

  // ── API routes ──────────────────────────────────────────────────────────────
  app.use('/api/v1/auth',      authLimiter,  authRoutes);
  app.use('/api/v1/trades',    tradeLimiter, tradingRoutes);
  app.use('/api/v1/portfolio',              portfolioRoutes);

  // ── 404 catch-all ───────────────────────────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, error: 'Route not found' });
  });

  // ── Global error handler (must be last) ─────────────────────────────────────
  app.use(errorHandler);

  return app;
}
