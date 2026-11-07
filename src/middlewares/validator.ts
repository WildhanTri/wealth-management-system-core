import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response.js';

/**
 * Higher-order middleware to validate req.body, req.query, or req.params using Zod.
 */
export function validate(schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dataToValidate = req[target];
      const parsed = await schema.parseAsync(dataToValidate);
      req[target] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        sendError({
          res,
          statusCode: 400,
          message: 'Validation failed for request data',
          errors: issues,
        });
        return;
      }
      sendError({
        res,
        statusCode: 400,
        message: 'Invalid request data',
        errors: error,
      });
    }
  };
}
