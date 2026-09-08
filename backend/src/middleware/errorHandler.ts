import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[Error Handler]', err);

  const status = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  const message = err.message || 'An unexpected internal server error occurred';

  res.status(status).json({
    success: false,
    error: {
      message,
      details: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    }
  });
}
