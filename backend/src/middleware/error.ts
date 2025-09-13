import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppError, ApiErrorResponse, ErrorCode } from '../types/errors.js';
import { logger } from '../utils/logger.js';

/**
 * Add request ID to all requests for tracking
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = uuidv4();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

/**
 * Global error handling middleware
 */
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId = req.requestId || 'unknown';
  
  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  let appError: AppError;

  // Convert known errors to AppError
  if (error instanceof AppError) {
    appError = error;
  } else {
    // Handle specific error types
    if (error.name === 'ValidationError') {
      appError = new AppError(
        ErrorCode.VALIDATION_ERROR,
        error.message,
        400,
        true,
        { originalError: error.name }
      );
    } else if (error.name === 'CastError') {
      appError = new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Invalid data format',
        400,
        true,
        { field: (error as any).path }
      );
    } else if (error.message?.includes('duplicate key')) {
      appError = new AppError(
        ErrorCode.RESOURCE_ALREADY_EXISTS,
        'Resource already exists',
        409
      );
    } else if (error.message?.includes('connection')) {
      appError = new AppError(
        ErrorCode.DATABASE_CONNECTION_ERROR,
        'Database connection error',
        503,
        true,
        { originalMessage: error.message }
      );
    } else {
      // Unknown error - treat as internal server error
      appError = new AppError(
        ErrorCode.INTERNAL_ERROR,
        process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : error.message,
        500,
        false,
        process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
      );
    }
  }

  // Log the error
  const logLevel = appError.statusCode >= 500 ? 'error' : 'warn';
  logger[logLevel]('Request error', {
    requestId,
    error: {
      code: appError.code,
      message: appError.message,
      statusCode: appError.statusCode,
      stack: appError.stack,
      details: appError.details,
    },
    request: {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: (req.user as any)?.id,
    },
  });

  // Send error response
  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      details: appError.details,
      stack: process.env.NODE_ENV === 'development' ? appError.stack : undefined,
    },
    timestamp: new Date().toISOString(),
    requestId,
  };

  res.status(appError.statusCode).json(errorResponse);
}

/**
 * Handle 404 errors for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new AppError(
    ErrorCode.RESOURCE_NOT_FOUND,
    `Route ${req.method} ${req.path} not found`,
    404
  );
  next(error);
}

/**
 * Async error wrapper to catch async errors in route handlers
 */
export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation error helper
 */
export function createValidationError(message: string, field?: string) {
  return new AppError(
    ErrorCode.VALIDATION_ERROR,
    message,
    400,
    true,
    field ? { field } : undefined
  );
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}