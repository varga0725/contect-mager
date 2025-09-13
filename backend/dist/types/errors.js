/**
 * Standardized error types and interfaces for the application
 */
export var ErrorCode;
(function (ErrorCode) {
    // Authentication & Authorization
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["INVALID_CREDENTIALS"] = "INVALID_CREDENTIALS";
    ErrorCode["SESSION_EXPIRED"] = "SESSION_EXPIRED";
    ErrorCode["CSRF_TOKEN_INVALID"] = "CSRF_TOKEN_INVALID";
    // Validation
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["INVALID_INPUT"] = "INVALID_INPUT";
    ErrorCode["MISSING_REQUIRED_FIELD"] = "MISSING_REQUIRED_FIELD";
    // Resource Management
    ErrorCode["RESOURCE_NOT_FOUND"] = "RESOURCE_NOT_FOUND";
    ErrorCode["RESOURCE_ALREADY_EXISTS"] = "RESOURCE_ALREADY_EXISTS";
    ErrorCode["RESOURCE_CONFLICT"] = "RESOURCE_CONFLICT";
    // Rate Limiting & Usage
    ErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    ErrorCode["USAGE_LIMIT_EXCEEDED"] = "USAGE_LIMIT_EXCEEDED";
    ErrorCode["QUOTA_EXCEEDED"] = "QUOTA_EXCEEDED";
    // External Services
    ErrorCode["AI_SERVICE_ERROR"] = "AI_SERVICE_ERROR";
    ErrorCode["AI_SERVICE_TIMEOUT"] = "AI_SERVICE_TIMEOUT";
    ErrorCode["AI_SERVICE_UNAVAILABLE"] = "AI_SERVICE_UNAVAILABLE";
    ErrorCode["PAYMENT_SERVICE_ERROR"] = "PAYMENT_SERVICE_ERROR";
    // Database
    ErrorCode["DATABASE_ERROR"] = "DATABASE_ERROR";
    ErrorCode["DATABASE_CONNECTION_ERROR"] = "DATABASE_CONNECTION_ERROR";
    ErrorCode["DATABASE_TIMEOUT"] = "DATABASE_TIMEOUT";
    // Internal
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
    ErrorCode["CONFIGURATION_ERROR"] = "CONFIGURATION_ERROR";
})(ErrorCode || (ErrorCode = {}));
export class AppError extends Error {
    code;
    statusCode;
    isOperational;
    details;
    constructor(code, message, statusCode = 500, isOperational = true, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.details = details;
        // Maintain proper stack trace
        Error.captureStackTrace(this, this.constructor);
    }
    toJSON() {
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
    constructor(message, details) {
        super(ErrorCode.VALIDATION_ERROR, message, 400, true, details);
    }
}
export class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(ErrorCode.UNAUTHORIZED, message, 401);
    }
}
export class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(ErrorCode.FORBIDDEN, message, 403);
    }
}
export class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(ErrorCode.RESOURCE_NOT_FOUND, `${resource} not found`, 404);
    }
}
export class ConflictError extends AppError {
    constructor(message) {
        super(ErrorCode.RESOURCE_CONFLICT, message, 409);
    }
}
export class RateLimitError extends AppError {
    constructor(message = 'Rate limit exceeded') {
        super(ErrorCode.RATE_LIMIT_EXCEEDED, message, 429);
    }
}
export class UsageLimitError extends AppError {
    constructor(message = 'Usage limit exceeded') {
        super(ErrorCode.USAGE_LIMIT_EXCEEDED, message, 429);
    }
}
export class AIServiceError extends AppError {
    constructor(message, details) {
        super(ErrorCode.AI_SERVICE_ERROR, message, 502, true, details);
    }
}
export class DatabaseError extends AppError {
    constructor(message, details) {
        super(ErrorCode.DATABASE_ERROR, message, 500, true, details);
    }
}
//# sourceMappingURL=errors.js.map