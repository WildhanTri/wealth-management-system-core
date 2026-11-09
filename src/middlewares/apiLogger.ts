import { Request, Response, NextFunction } from 'express';
import { ApiLog } from '../models/ApiLog.js';

/**
 * Sanitizes headers by redacting sensitive keys like authorization tokens.
 */
function sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = { ...headers };
  const sensitiveKeys = ['authorization', 'cookie', 'x-api-key', 'set-cookie'];

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    }
  }
  return sanitized;
}

/**
 * Sanitizes request/response bodies by redacting sensitive keys like passwords.
 */
function sanitizePayload(payload: any): any {
  if (!payload || typeof payload !== 'object') return payload;
  if (Array.isArray(payload)) return payload.map(sanitizePayload);

  const sanitized: Record<string, any> = {};
  const sensitiveKeys = [
    'password',
    'oldpassword',
    'newpassword',
    'confirmpassword',
    'currentpassword',
    'secret',
  ];

  for (const [key, value] of Object.entries(payload)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizePayload(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Global API Logging Middleware.
 * Captures all request/response details, headers, payloads, status code, and latency,
 * and asynchronously saves them into the 'api_logs' PostgreSQL table.
 */
export function apiLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = process.hrtime();

  // Capture request snapshot
  const requestSnapshot = {
    method: req.method,
    endpoint: req.originalUrl || req.url,
    requestHeaders: sanitizeHeaders(req.headers),
    requestQuery: req.query || {},
    requestParams: req.params || {},
    requestBody: req.body !== undefined ? sanitizePayload(req.body) : null,
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null,
    userAgent: req.get('user-agent') || null,
  };

  // Monkey-patch response.send to capture response body
  const originalSend = res.send;
  let responseBody: any = null;

  res.send = function (body?: any): Response {
    responseBody = body;
    return originalSend.call(this, body);
  };

  // When request response cycle finishes, write to api_logs
  res.on('finish', async () => {
    try {
      const diff = process.hrtime(startTime);
      const durationMs = Math.round((diff[0] * 1000 + diff[1] / 1e6) * 100) / 100;

      let parsedResponseBody = responseBody;
      if (typeof responseBody === 'string') {
        try {
          parsedResponseBody = JSON.parse(responseBody);
        } catch {
          // Keep as string if it's plain text or html
        }
      }

      const responseHeaders = sanitizeHeaders(res.getHeaders());

      // Asynchronously log to PostgreSQL without blocking execution
      await ApiLog.create({
        id: undefined as any, // Sequelize will auto-generate UUID
        name: `API Hit: ${requestSnapshot.method} ${requestSnapshot.endpoint}`,
        description: `HTTP ${res.statusCode} in ${durationMs}ms`,
        method: requestSnapshot.method,
        endpoint: requestSnapshot.endpoint,
        status_code: res.statusCode,
        request_headers: requestSnapshot.requestHeaders,
        request_query: requestSnapshot.requestQuery,
        request_params: requestSnapshot.requestParams,
        request_body: requestSnapshot.requestBody,
        response_headers: responseHeaders,
        response_body: sanitizePayload(parsedResponseBody),
        duration_ms: durationMs,
        ip_address: requestSnapshot.ipAddress,
        user_agent: requestSnapshot.userAgent,
        error_message: res.statusCode >= 400 ? (parsedResponseBody?.message || `Error status ${res.statusCode}`) : null,
        created_by: 'system_api_logger',
        updated_by: 'system_api_logger',
        is_active: true,
        is_deleted: false,
      });
    } catch (logError) {
      console.error(' Failed to record API log to database:', logError);
    }
  });

  next();
}

