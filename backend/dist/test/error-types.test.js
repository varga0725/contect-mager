import { describe, it, expect } from 'vitest';
import { AppError, ErrorCode, ValidationError, AuthenticationError, AuthorizationError, NotFoundError, ConflictError, RateLimitError, UsageLimitError, AIServiceError, DatabaseError } from '../types/errors.js';
describe('Error Types', () => {
    describe('AppError Base Class', () => {
        it('should create an AppError with correct properties', () => {
            const error = new AppError(ErrorCode.VALIDATION_ERROR, 'Test error message', 400, true, { field: 'email' });
            expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
            expect(error.message).toBe('Test error message');
            expect(error.statusCode).toBe(400);
            expect(error.isOperational).toBe(true);
            expect(error.details).toEqual({ field: 'email' });
            expect(error.name).toBe('Error');
        });
        it('should have default values for optional parameters', () => {
            const error = new AppError(ErrorCode.INTERNAL_ERROR, 'Internal error');
            expect(error.statusCode).toBe(500);
            expect(error.isOperational).toBe(true);
            expect(error.details).toBeUndefined();
        });
        it('should serialize to JSON correctly', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';
            const error = new AppError(ErrorCode.INTERNAL_ERROR, 'Internal error', 500, false, { context: 'test' });
            const json = error.toJSON();
            expect(json).toEqual({
                success: false,
                error: {
                    code: ErrorCode.INTERNAL_ERROR,
                    message: 'Internal error',
                    details: { context: 'test' },
                    stack: expect.any(String),
                },
            });
            process.env.NODE_ENV = originalEnv;
        });
        it('should not include stack trace in production', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            const error = new AppError(ErrorCode.INTERNAL_ERROR, 'Internal error');
            const json = error.toJSON();
            expect(json.error.stack).toBeUndefined();
            process.env.NODE_ENV = originalEnv;
        });
        it('should include stack trace in development', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';
            const error = new AppError(ErrorCode.INTERNAL_ERROR, 'Internal error');
            const json = error.toJSON();
            expect(json.error.stack).toBeDefined();
            expect(typeof json.error.stack).toBe('string');
            process.env.NODE_ENV = originalEnv;
        });
    });
    describe('ValidationError', () => {
        it('should create ValidationError with correct properties', () => {
            const error = new ValidationError('Invalid email format', { field: 'email' });
            expect(error).toBeInstanceOf(AppError);
            expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
            expect(error.statusCode).toBe(400);
            expect(error.message).toBe('Invalid email format');
            expect(error.details).toEqual({ field: 'email' });
            expect(error.isOperational).toBe(true);
        });
        it('should work without details', () => {
            const error = new ValidationError('Invalid input');
            expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
            expect(error.message).toBe('Invalid input');
            expect(error.details).toBeUndefined();
        });
    });
    describe('AuthenticationError', () => {
        it('should create AuthenticationError with default message', () => {
            const error = new AuthenticationError();
            expect(error).toBeInstanceOf(AppError);
            expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
            expect(error.statusCode).toBe(401);
            expect(error.message).toBe('Authentication required');
        });
        it('should create AuthenticationError with custom message', () => {
            const error = new AuthenticationError('Invalid credentials');
            expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
            expect(error.message).toBe('Invalid credentials');
        });
    });
    describe('AuthorizationError', () => {
        it('should create AuthorizationError with default message', () => {
            const error = new AuthorizationError();
            expect(error).toBeInstanceOf(AppError);
            expect(error.code).toBe(ErrorCode.FORBIDDEN);
            expect(error.statusCode).toBe(403);
            expect(error.message).toBe('Insufficient permissions');
        });
        it('should create AuthorizationError with custom message', () => {
            const error = new AuthorizationError('Access denied');
            expect(error.code).toBe(ErrorCode.FORBIDDEN);
            expect(error.message).toBe('Access denied');
        });
    });
    describe('NotFoundError', () => {
        it('should create NotFoundError with default message', () => {
            const error = new NotFoundError();
            expect(error).toBeInstanceOf(AppError);
            expect(error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
            expect(error.statusCode).toBe(404);
            expect(error.message).toBe('Resource not found');
        });
        it('should create NotFoundError with custom resource name', () => {
            const error = new NotFoundError('User');
            expect(error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
            expect(error.message).toBe('User not found');
        });
    });
    describe('ConflictError', () => {
        it('should create ConflictError with correct properties', () => {
            const error = new ConflictError('Resource already exists');
            expect(error).toBeInstanceOf(AppError);
            expect(error.code).toBe(ErrorCode.RESOURCE_CONFLICT);
            expect(error.statusCode).toBe(409);
            expect(error.message).toBe('Resource already exists');
        });
    });
    describe('RateLimitError', () => {
        it('should create RateLimitError with default message', () => {
            const error = new RateLimitError();
            expect(error).toBeInstanceOf(AppError);
            expect(error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
            expect(error.statusCode).toBe(429);
            expect(error.message).toBe('Rate limit exceeded');
        });
        it('should create RateLimitError with custom message', () => {
            const error = new RateLimitError('Too many requests');
            expect(error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
            expect(error.message).toBe('Too many requests');
        });
    });
    describe('UsageLimitError', () => {
        it('should create UsageLimitError with default message', () => {
            const error = new UsageLimitError();
            expect(error).toBeInstanceOf(AppError);
            expect(error.code).toBe(ErrorCode.USAGE_LIMIT_EXCEEDED);
            expect(error.statusCode).toBe(429);
            expect(error.message).toBe('Usage limit exceeded');
        });
        it('should create UsageLimitError with custom message', () => {
            const error = new UsageLimitError('Monthly limit reached');
            expect(error.code).toBe(ErrorCode.USAGE_LIMIT_EXCEEDED);
            expect(error.message).toBe('Monthly limit reached');
        });
    });
    describe('AIServiceError', () => {
        it('should create AIServiceError with correct properties', () => {
            const error = new AIServiceError('AI service unavailable', { service: 'gemini' });
            expect(error).toBeInstanceOf(AppError);
            expect(error.code).toBe(ErrorCode.AI_SERVICE_ERROR);
            expect(error.statusCode).toBe(502);
            expect(error.message).toBe('AI service unavailable');
            expect(error.details).toEqual({ service: 'gemini' });
            expect(error.isOperational).toBe(true);
        });
        it('should work without details', () => {
            const error = new AIServiceError('Service error');
            expect(error.code).toBe(ErrorCode.AI_SERVICE_ERROR);
            expect(error.message).toBe('Service error');
            expect(error.details).toBeUndefined();
        });
    });
    describe('DatabaseError', () => {
        it('should create DatabaseError with correct properties', () => {
            const error = new DatabaseError('Connection failed', { host: 'localhost' });
            expect(error).toBeInstanceOf(AppError);
            expect(error.code).toBe(ErrorCode.DATABASE_ERROR);
            expect(error.statusCode).toBe(500);
            expect(error.message).toBe('Connection failed');
            expect(error.details).toEqual({ host: 'localhost' });
            expect(error.isOperational).toBe(true);
        });
        it('should work without details', () => {
            const error = new DatabaseError('Query failed');
            expect(error.code).toBe(ErrorCode.DATABASE_ERROR);
            expect(error.message).toBe('Query failed');
            expect(error.details).toBeUndefined();
        });
    });
    describe('Error Code Enum', () => {
        it('should have all expected error codes', () => {
            const expectedCodes = [
                'UNAUTHORIZED',
                'FORBIDDEN',
                'INVALID_CREDENTIALS',
                'SESSION_EXPIRED',
                'VALIDATION_ERROR',
                'INVALID_INPUT',
                'MISSING_REQUIRED_FIELD',
                'RESOURCE_NOT_FOUND',
                'RESOURCE_ALREADY_EXISTS',
                'RESOURCE_CONFLICT',
                'RATE_LIMIT_EXCEEDED',
                'USAGE_LIMIT_EXCEEDED',
                'QUOTA_EXCEEDED',
                'AI_SERVICE_ERROR',
                'AI_SERVICE_TIMEOUT',
                'AI_SERVICE_UNAVAILABLE',
                'PAYMENT_SERVICE_ERROR',
                'DATABASE_ERROR',
                'DATABASE_CONNECTION_ERROR',
                'DATABASE_TIMEOUT',
                'INTERNAL_ERROR',
                'SERVICE_UNAVAILABLE',
                'CONFIGURATION_ERROR',
            ];
            expectedCodes.forEach(code => {
                expect(ErrorCode[code]).toBeDefined();
                expect(typeof ErrorCode[code]).toBe('string');
            });
        });
        it('should have string values for all error codes', () => {
            Object.values(ErrorCode).forEach(code => {
                expect(typeof code).toBe('string');
                expect(code.length).toBeGreaterThan(0);
            });
        });
    });
    describe('Error Inheritance', () => {
        it('should maintain proper inheritance chain', () => {
            const validationError = new ValidationError('Test');
            const authError = new AuthenticationError('Test');
            const aiError = new AIServiceError('Test');
            expect(validationError).toBeInstanceOf(Error);
            expect(validationError).toBeInstanceOf(AppError);
            expect(validationError).toBeInstanceOf(ValidationError);
            expect(authError).toBeInstanceOf(Error);
            expect(authError).toBeInstanceOf(AppError);
            expect(authError).toBeInstanceOf(AuthenticationError);
            expect(aiError).toBeInstanceOf(Error);
            expect(aiError).toBeInstanceOf(AppError);
            expect(aiError).toBeInstanceOf(AIServiceError);
        });
        it('should have proper stack traces', () => {
            const error = new ValidationError('Test error');
            expect(error.stack).toBeDefined();
            expect(error.stack).toContain('Test error');
            expect(typeof error.stack).toBe('string');
        });
    });
    describe('Error Serialization', () => {
        it('should serialize all error types correctly', () => {
            const errors = [
                new ValidationError('Validation failed', { field: 'email' }),
                new AuthenticationError('Auth failed'),
                new NotFoundError('User'),
                new AIServiceError('AI failed', { service: 'gemini' }),
            ];
            errors.forEach(error => {
                const json = error.toJSON();
                expect(json).toHaveProperty('success', false);
                expect(json).toHaveProperty('error');
                expect(json.error).toHaveProperty('code');
                expect(json.error).toHaveProperty('message');
                expect(typeof json.error.code).toBe('string');
                expect(typeof json.error.message).toBe('string');
            });
        });
    });
});
//# sourceMappingURL=error-types.test.js.map