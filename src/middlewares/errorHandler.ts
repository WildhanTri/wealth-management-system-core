import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('💥 Unhandled Exception Caught in Middleware:', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'An unexpected internal error occurred';

  sendError({
    res,
    statusCode,
    message,
    errors: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

