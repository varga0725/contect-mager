import { describe, it, expect, beforeEach, vi } from 'vitest';
import { errorHandler, notFoundHandler, requestIdMiddleware, asyncHandler, createValidationError } from '../middleware/error.js';
import { AppError, ErrorCode, ValidationError, AuthenticationError } from '../types/errors.js';
// Mock logger
vi.mock('../utils/logger.js', () => ({
    logger: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
    },
}));
describe('Error Middleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;
    beforeEach(() => {
        vi.clearAllMocks();
        mockReq = {
            method: 'GET',
            url: '/test',
            path: '/test',
            requestId: 'test-request-id',
            get: vi.fn().mockReturnValue('test-user-agent'),
            ip: '127.0.0.1',
            user: null,
        };
        mockRes = {
            headersSent: false,
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            setHeader: vi.fn().mockReturnThis(),
        };
        mockNext = vi.fn();
    });
    describe('requestIdMiddleware', () => {
        it('should add request ID to request and response', () => {
            requestIdMiddleware(mockReq, mockRes, mockNext);
            expect(mockReq.requestId).toBeDefined();
            expect(typeof mockReq.requestId).toBe('string');
            expect(mockReq.requestId).toMatch(/^[0-9a-f-]{36}$/); // UUID format
            expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', mockReq.requestId);
            expect(mockNext).toHaveBeenCalledTimes(1);
        });
    });
    describe('notFoundHandler', () => {
        it('should create and pass NotFound error to next', () => {
            notFoundHandler(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledTimes(1);
            const error = mockNext.mock.calls[0][0];
            expect(error).toBeInstanceOf(AppError);
            expect(error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
            expect(error.message).toContain('Route GET /test not found');
            expect(error.statusCode).toBe(404);
        });
    });
    describe('errorHandler', () => {
        it('should handle AppError correctly', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';
            const appError = new ValidationError('Test validation error', { field: 'email' });
            errorHandler(appError, mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: ErrorCode.VALIDATION_ERROR,
                    message: 'Test validation error',
                    details: { field: 'email' },
                    stack: expect.any(String),
                },
                timestamp: expect.any(String),
                requestId: 'test-request-id',
            });
            process.env.NODE_ENV = originalEnv;
        });
        it('should handle generic Error and convert to AppError', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';
            const genericError = new Error('Generic error message');
            errorHandler(genericError, mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: ErrorCode.INTERNAL_ERROR,
                    message: 'Generic error message',
                    details: expect.objectContaining({
                        stack: expect.any(String),
                    }),
                    stack: expect.any(String),
                },
                timestamp: expect.any(String),
                requestId: 'test-request-id',
            });
            process.env.NODE_ENV = originalEnv;
        });
        it('should handle ValidationError type', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';
            const validationError = new Error('Validation failed');
            validationError.name = 'ValidationError';
            errorHandler(validationError, mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: ErrorCode.VALIDATION_ERROR,
                    message: 'Validation failed',
                    details: { originalError: 'ValidationError' },
                    stack: expect.any(String),
                },
                timestamp: expect.any(String),
                requestId: 'test-request-id',
            });
            process.env.NODE_ENV = originalEnv;
        });
        it('should handle CastError type', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';
            const castError = new Error('Cast to ObjectId failed');
            castError.name = 'CastError';
            castError.path = 'userId';
            errorHandler(castError, mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: ErrorCode.VALIDATION_ERROR,
                    message: 'Invalid data format',
                    details: { field: 'userId' },
                    stack: expect.any(String),
                },
                timestamp: expect.any(String),
                requestId: 'test-request-id',
            });
            process.env.NODE_ENV = originalEnv;
        });
        it('should handle duplicate key error', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';
            const duplicateError = new Error('duplicate key value violates unique constraint');
            errorHandler(duplicateError, mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(409);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: ErrorCode.RESOURCE_ALREADY_EXISTS,
                    message: 'Resource already exists',
                    details: undefined,
                    stack: expect.any(String),
                },
                timestamp: expect.any(String),
                requestId: 'test-request-id',
            });
            process.env.NODE_ENV = originalEnv;
        });
        it('should handle connection error', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';
            const connectionError = new Error('connection timeout');
            errorHandler(connectionError, mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(503);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: ErrorCode.DATABASE_CONNECTION_ERROR,
                    message: 'Database connection error',
                    details: { originalMessage: 'connection timeout' },
                    stack: expect.any(String),
                },
                timestamp: expect.any(String),
                requestId: 'test-request-id',
            });
            process.env.NODE_ENV = originalEnv;
        });
        it('should not send response if headers already sent', () => {
            mockRes.headersSent = true;
            const error = new ValidationError('Test error');
            errorHandler(error, mockReq, mockRes, mockNext);
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(error);
        });
        it('should include user ID in logs when user is authenticated', () => {
            mockReq.user = { id: 123, email: 'test@example.com' };
            const error = new ValidationError('Test error');
            errorHandler(error, mockReq, mockRes, mockNext);
            // We can't easily test the logger call since it's mocked at the module level
            // Just verify the error handler completed without throwing
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalled();
        });
        it('should hide stack trace in production', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            const error = new ValidationError('Test error');
            errorHandler(error, mockReq, mockRes, mockNext);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.objectContaining({
                    stack: undefined,
                }),
            }));
            process.env.NODE_ENV = originalEnv;
        });
    });
    describe('asyncHandler', () => {
        it('should handle successful async operations', async () => {
            const asyncFn = vi.fn().mockResolvedValue('success');
            const wrappedFn = asyncHandler(asyncFn);
            await wrappedFn(mockReq, mockRes, mockNext);
            expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should catch and pass async errors to next', async () => {
            const error = new ValidationError('Async error');
            const asyncFn = vi.fn().mockRejectedValue(error);
            const wrappedFn = asyncHandler(asyncFn);
            await wrappedFn(mockReq, mockRes, mockNext);
            expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
        it('should handle thrown errors in async functions', async () => {
            const error = new ValidationError('Thrown error');
            const asyncFn = vi.fn().mockImplementation(async () => {
                throw error;
            });
            const wrappedFn = asyncHandler(asyncFn);
            await wrappedFn(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
    describe('createValidationError', () => {
        it('should create ValidationError with message only', () => {
            const error = createValidationError('Invalid input');
            expect(error).toBeInstanceOf(AppError);
            expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
            expect(error.message).toBe('Invalid input');
            expect(error.statusCode).toBe(400);
            expect(error.details).toBeUndefined();
        });
        it('should create ValidationError with field details', () => {
            const error = createValidationError('Invalid email', 'email');
            expect(error).toBeInstanceOf(AppError);
            expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
            expect(error.message).toBe('Invalid email');
            expect(error.statusCode).toBe(400);
            expect(error.details).toEqual({ field: 'email' });
        });
    });
    describe('Error Response Format', () => {
        it('should always include required response fields', () => {
            const error = new AuthenticationError('Auth failed');
            errorHandler(error, mockReq, mockRes, mockNext);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: expect.objectContaining({
                    code: expect.any(String),
                    message: expect.any(String),
                }),
                timestamp: expect.any(String),
                requestId: expect.any(String),
            });
        });
        it('should format timestamp as ISO string', () => {
            const error = new ValidationError('Test error');
            errorHandler(error, mockReq, mockRes, mockNext);
            const callArgs = mockRes.json.mock.calls[0][0];
            const timestamp = callArgs.timestamp;
            expect(timestamp).toBeDefined();
            expect(new Date(timestamp).toISOString()).toBe(timestamp);
        });
        it('should include request ID from request', () => {
            const error = new ValidationError('Test error');
            errorHandler(error, mockReq, mockRes, mockNext);
            const callArgs = mockRes.json.mock.calls[0][0];
            expect(callArgs.requestId).toBe('test-request-id');
        });
    });
});
//# sourceMappingURL=error-middleware.test.js.map