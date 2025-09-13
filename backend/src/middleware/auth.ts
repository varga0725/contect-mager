import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      subscriptionTier: string;
      monthlyUsage: number;
      usageResetDate: Date;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}

/**
 * Middleware to ensure user is authenticated
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    }
  });
}

/**
 * Middleware to check if user is already authenticated (for login/register routes)
 */
export function requireGuest(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated()) {
    return next();
  }
  
  res.status(400).json({
    success: false,
    error: {
      code: 'ALREADY_AUTHENTICATED',
      message: 'User is already authenticated'
    }
  });
}

/**
 * Optional authentication middleware - doesn't block if not authenticated
 */
export function optionalAuth(_req: Request, _res: Response, next: NextFunction): void {
  // Always proceed, user may or may not be authenticated
  next();
}