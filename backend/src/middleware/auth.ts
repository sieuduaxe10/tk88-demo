import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth';
import { logger } from '../utils/logger';

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 * Attaches userId to request if valid
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header is required',
      });
    }

    // Extract token from "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization header format. Use: Bearer <token>',
      });
    }

    const token = parts[1];

    // Verify token
    const result = authService.verifyToken(token);

    if (!result.valid) {
      return res.status(401).json({
        success: false,
        error: result.error,
      });
    }

    // Attach userId to request
    (req as any).userId = result.userId;
    next();
  } catch (error) {
    logger.error('Auth middleware error', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches userId if token is valid, but doesn't fail if missing
 */
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const result = authService.verifyToken(token);

        if (result.valid) {
          (req as any).userId = result.userId;
        }
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error', error);
    next(); // Continue anyway
  }
};
