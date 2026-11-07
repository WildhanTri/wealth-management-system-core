import { Response } from 'express';
import { keysToCamel } from './caseConverter.js';

export interface ApiResponseOptions<T = any> {
  res: Response;
  statusCode?: number;
  message?: string;
  data?: T;
  meta?: Record<string, any>;
  errors?: any;
}

/**
 * Sends a standardized camelCase success response
 */
export function sendSuccess<T = any>({
  res,
  statusCode = 200,
  message = 'Operation successful',
  data,
  meta,
}: ApiResponseOptions<T>): Response {
  const payload: Record<string, any> = {
    success: true,
    statusCode,
    message,
  };

  if (data !== undefined) {
    payload.data = keysToCamel(data);
  }

  if (meta !== undefined) {
    payload.meta = keysToCamel(meta);
  }

  return res.status(statusCode).json(payload);
}

/**
 * Sends a standard 201 Created response
 */
export function sendCreated<T = any>({
  res,
  message = 'Resource created successfully',
  data,
  meta,
}: Omit<ApiResponseOptions<T>, 'statusCode'>): Response {
  return sendSuccess({
    res,
    statusCode: 201,
    message,
    data,
    meta,
  });
}

/**
 * Sends a standardized camelCase error response
 */
export function sendError({
  res,
  statusCode = 500,
  message = 'Internal server error',
  errors,
}: ApiResponseOptions): Response {
  const payload: Record<string, any> = {
    success: false,
    statusCode,
    message,
  };

  if (errors !== undefined) {
    payload.errors = keysToCamel(errors);
  }

  return res.status(statusCode).json(payload);
}

