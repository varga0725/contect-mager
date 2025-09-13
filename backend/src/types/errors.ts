/**
 * Standardized error types and interfaces for the application
 */

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string;
  };
  timestamp: string;
  requestId?: string;
}

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp?: string;
  requestId?: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  CSRF_TOKEN_INVALID = 'CSRF_TOKEN_INVALID',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resource Management
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // Rate Limiting & Usage
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  USAGE_LIMIT_EXCEEDED = 'USAGE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // External Services
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  AI_SERVICE_TIMEOUT = 'AI_SERVICE_TIMEOUT',
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  PAYMENT_SERVICE_ERROR = 'PAYMENT_SERVICE_ERROR',
  
  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATABASE_TIMEOUT = 'DATABASE_TIMEOUT',
  
  // Internal
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    
    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): Omit<ApiErrorResponse, 'timestamp' | 'requestId'> {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        stack: process.env.NODE_ENV === 'development' ? this.stack : undefined,
      },
    };
  }
}

// Specific error classes for common scenarios
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(ErrorCode.UNAUTHORIZED, message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(ErrorCode.FORBIDDEN, message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(ErrorCode.RESOURCE_NOT_FOUND, `${resource} not found`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(ErrorCode.RESOURCE_CONFLICT, message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(ErrorCode.RATE_LIMIT_EXCEEDED, message, 429);
  }
}

export class UsageLimitError extends AppError {
  constructor(message: string = 'Usage limit exceeded') {
    super(ErrorCode.USAGE_LIMIT_EXCEEDED, message, 429);
  }
}

export class AIServiceError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.AI_SERVICE_ERROR, message, 502, true, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.DATABASE_ERROR, message, 500, true, details);
  }
}