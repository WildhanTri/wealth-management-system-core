import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { apiLogger } from './middlewares/apiLogger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import routes from './routes/index.js';
import { sendError } from './utils/response.js';

export function createApp(): Application {
  const app = express();

  // CORS configuration (placed before helmet so preflight OPTIONS are answered immediately)
  const allowedOrigins =
    env.corsOrigin === '*'
      ? true
      : env.corsOrigin.split(',').map((origin) => origin.trim().replace(/\/$/, ''));

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    })
  );

  // Security headers with cross-origin resource policy enabled for API consumers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Global API Logging Middleware: intercepts every incoming request and outgoing response
  // and saves headers, request, response, status, duration to 'api_logs' table in PostgreSQL
  app.use(apiLogger);

  // API Version 1 Routes
  app.use('/api/v1', routes);

  // Fallback 404 Route
  app.use('*', (req: Request, res: Response) => {
    sendError({
      res,
      statusCode: 404,
      message: `Resource not found on endpoint: ${req.method} ${req.originalUrl}`,
    });
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}

