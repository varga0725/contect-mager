import { Router, Request, Response, NextFunction } from 'express';
import passport from '../config/passport.js';
import { AuthService } from '../services/auth.js';
import { requireAuth, requireGuest } from '../middleware/auth.js';
import { asyncHandler, createValidationError } from '../middleware/error.js';
import { ValidationError, AuthenticationError } from '../types/errors.js';
import { loggers } from '../utils/logger.js';
import { rateLimiters, validationSchemas, handleValidationErrors } from '../middleware/security.js';

const router = Router();

// Validation helper
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', 
  rateLimiters.auth,
  requireGuest, 
  validationSchemas.userRegistration,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    throw createValidationError('Email and password are required');
  }

  if (!validateEmail(email)) {
    throw createValidationError('Invalid email format', 'email');
  }

  if (!validatePassword(password)) {
    throw createValidationError(
      'Password must be at least 8 characters with uppercase, lowercase, and number',
      'password'
    );
  }

  try {
    // Create user
    const user = await AuthService.createUser({ email, password });

    // Log successful registration
    loggers.auth.register(user.id, user.email, req.ip || 'unknown');

    // Log in the user automatically after registration
    req.login(user, (err) => {
      if (err) {
        throw new AuthenticationError('User created but login failed');
      }

      return res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            subscriptionTier: user.subscriptionTier,
            monthlyUsage: user.monthlyUsage
          }
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'User already exists with this email') {
      throw new ValidationError('User already exists with this email', { field: 'email' });
    }
    throw error;
  }
}));

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', 
  rateLimiters.auth,
  requireGuest,
  validationSchemas.userLogin,
  handleValidationErrors,
  (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return next(createValidationError('Email and password are required'));
  }

  passport.authenticate('local', (err: any, user: any, info: any) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      loggers.auth.loginFailed(email, req.ip || 'unknown', info?.message || 'Invalid credentials');
      return next(new AuthenticationError(info?.message || 'Invalid email or password'));
    }

    req.login(user, (loginErr) => {
      if (loginErr) {
        return next(new AuthenticationError('Login failed'));
      }

      // Log successful login
      loggers.auth.login(user.id, user.email, req.ip || 'unknown');

      return res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            subscriptionTier: user.subscriptionTier,
            monthlyUsage: user.monthlyUsage
          }
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    });
  })(req, res, next);
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', requireAuth, (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  
  req.logout((err) => {
    if (err) {
      return next(new AuthenticationError('Logout failed'));
    }

    // Log successful logout
    if (user) {
      loggers.auth.logout(user.id, user.email);
    }

    return res.json({
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  });
});

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', requireAuth, (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  
  if (!user) {
    return next(new AuthenticationError('No authenticated user'));
  }

  return res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        monthlyUsage: user.monthlyUsage
      }
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

export default router;