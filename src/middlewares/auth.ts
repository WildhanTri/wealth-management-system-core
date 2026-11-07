import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export interface JwtTokenPayload {
  id: string;
  email: string;
  fullname: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Generate a signed JWT token for an authenticated user
 */
export function generateToken(user: User): string {
  const payload: JwtTokenPayload = {
    id: user.id,
    email: user.email,
    fullname: user.fullname,
  };

  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn as any,
  });
}

/**
 * Express middleware to authenticate requests via JWT Bearer Token
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Authentication token missing or invalid format. Please provide a Bearer token.',
    });
    return;
  }

  const token = authHeader.substring(7).trim();

  try {
    const decoded = jwt.verify(token, env.jwt.secret) as JwtTokenPayload;

    const user = await User.findOne({
      where: {
        id: decoded.id,
        is_active: true,
        is_deleted: false,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'The user account associated with this token no longer exists or has been deactivated.',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.',
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Invalid authorization token. Access denied.',
    });
  }
}

/**
 * Optional authentication middleware: if token present, sets req.user; otherwise proceeds.
 */
export async function optionalAuthenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7).trim();
  try {
    const decoded = jwt.verify(token, env.jwt.secret) as JwtTokenPayload;
    const user = await User.findOne({
      where: {
        id: decoded.id,
        is_active: true,
        is_deleted: false,
      },
    });
    if (user) {
      req.user = user;
    }
  } catch {
    // Ignore invalid token for optional auth
  }
  next();
}

