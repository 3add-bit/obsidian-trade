import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { env } from '../config/env';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    const fields = err.flatten().fieldErrors;
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      fields,
    });
    return;
  }

  // Known application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
    return;
  }

  // Postgres unique constraint violation
  if (typeof err === 'object' && err !== null && 'code' in err) {
    if ((err as { code: string }).code === '23505') {
      res.status(409).json({ success: false, error: 'Resource already exists' });
      return;
    }
  }

  // Unknown errors — don't leak internals in production
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(env.NODE_ENV === 'development' && {
      detail: err instanceof Error ? err.message : String(err),
    }),
  });
}
