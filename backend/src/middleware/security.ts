import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult, param, query } from 'express-validator';
import { AppError, ErrorCode } from '../types/errors.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

/**
 * Input sanitization middleware
 * Sanitizes all string inputs to prevent XSS attacks
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      // Simple HTML/script tag removal for security
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize route parameters
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
}

/**
 * Rate limiting configurations for different endpoint types
 */
export const rateLimiters = {
  // General API rate limiting
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      success: false,
      error: {
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        message: 'Too many requests, please try again later',
      },
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
      });
      
      res.status(429).json({
        success: false,
        error: {
          code: ErrorCode.RATE_LIMIT_EXCEEDED,
          message: 'Too many requests, please try again later',
        },
        timestamp: new Date().toISOString(),
      });
    },
  }),

  // Strict rate limiting for authentication endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: {
      success: false,
      error: {
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        message: 'Too many authentication attempts, please try again later',
      },
      timestamp: new Date().toISOString(),
    },
    skipSuccessfulRequests: true,
    handler: (req: Request, res: Response) => {
      logger.warn('Auth rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
      });
      
      res.status(429).json({
        success: false,
        error: {
          code: ErrorCode.RATE_LIMIT_EXCEEDED,
          message: 'Too many authentication attempts, please try again later',
        },
        timestamp: new Date().toISOString(),
      });
    },
  }),

  // Rate limiting for AI content generation
  aiGeneration: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 AI requests per minute
    message: {
      success: false,
      error: {
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        message: 'AI generation rate limit exceeded, please wait before making more requests',
      },
      timestamp: new Date().toISOString(),
    },
    handler: (req: Request, res: Response) => {
      logger.warn('AI generation rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: (req.user as any)?.id,
        path: req.path,
      });
      
      res.status(429).json({
        success: false,
        error: {
          code: ErrorCode.RATE_LIMIT_EXCEEDED,
          message: 'AI generation rate limit exceeded, please wait before making more requests',
        },
        timestamp: new Date().toISOString(),
      });
    },
  }),

  // Rate limiting for password reset
  passwordReset: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 password reset attempts per hour
    message: {
      success: false,
      error: {
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        message: 'Too many password reset attempts, please try again later',
      },
      timestamp: new Date().toISOString(),
    },
  }),
};

/**
 * CSRF protection middleware
 * Validates CSRF tokens for state-changing operations
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for webhook endpoints
  if (req.path.includes('/webhook')) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    logger.warn('CSRF token validation failed', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      hasToken: !!token,
      hasSessionToken: !!sessionToken,
    });

    return res.status(403).json({
      success: false,
      error: {
        code: ErrorCode.CSRF_TOKEN_INVALID,
        message: 'Invalid CSRF token',
      },
      timestamp: new Date().toISOString(),
    });
  }

  next();
}

/**
 * Generate and set CSRF token
 */
export function generateCSRFToken(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  
  res.locals.csrfToken = req.session.csrfToken;
  next();
}

/**
 * Input validation schemas
 */
export const validationSchemas = {
  // User registration validation
  userRegistration: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be between 8 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  ],

  // User login validation
  userLogin: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],

  // Content generation validation
  contentGeneration: [
    body('prompt')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Prompt must be between 1 and 1000 characters'),
    body('platform')
      .isIn(['instagram', 'tiktok', 'youtube', 'linkedin', 'twitter'])
      .withMessage('Invalid platform'),
    body('contentType')
      .isIn(['caption', 'image', 'video'])
      .withMessage('Invalid content type'),
  ],

  // Scheduling validation
  scheduling: [
    body('postId')
      .isInt({ min: 1 })
      .withMessage('Valid post ID is required'),
    body('scheduledAt')
      .isISO8601()
      .withMessage('Valid ISO 8601 date is required')
      .custom((value) => {
        const scheduledDate = new Date(value);
        const now = new Date();
        if (scheduledDate <= now) {
          throw new Error('Scheduled date must be in the future');
        }
        return true;
      }),
  ],

  // ID parameter validation
  idParam: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Valid ID is required'),
  ],

  // Pagination validation
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Page must be between 1 and 1000'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],
};

/**
 * Validation result handler
 */
export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
    }));

    logger.warn('Validation errors', {
      errors: errorMessages,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    return res.status(400).json({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        details: { errors: errorMessages },
      },
      timestamp: new Date().toISOString(),
    });
  }

  next();
}

/**
 * Security headers middleware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Additional security headers beyond helmet
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
}

/**
 * API key validation middleware for external service endpoints
 */
export function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.INTERNAL_API_KEY;

  if (!validApiKey) {
    logger.error('Internal API key not configured');
    return res.status(500).json({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Server configuration error',
      },
      timestamp: new Date().toISOString(),
    });
  }

  if (!apiKey || apiKey !== validApiKey) {
    logger.warn('Invalid API key attempt', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
    });

    return res.status(401).json({
      success: false,
      error: {
        code: ErrorCode.UNAUTHORIZED,
        message: 'Invalid API key',
      },
      timestamp: new Date().toISOString(),
    });
  }

  next();
}