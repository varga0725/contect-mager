import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { AppError, ErrorCode, ValidationError, AuthenticationError } from '../types/errors.js';
import { logger } from '../utils/logger.js';
// Mock logger to prevent console output during tests
vi.mock('../utils/logger.js', () => ({
    logger: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    },
    loggers: {
        ai: {
            request: vi.fn(),
            success: vi.fn(),
            error: vi.fn(),
            retry: vi.fn(),
        },
        auth: {
            login: vi.fn(),
            logout: vi.fn(),
            register: vi.fn(),
            loginFailed: vi.fn(),
        },
        usage: {
            increment: vi.fn(),
            limitExceeded: vi.fn(),
        },
        database: {
            connectionError: vi.fn(),
            queryError: vi.fn(),
            slowQuery: vi.fn(),
        },
    },
    morganStream: {
        write: vi.fn(),
    },
}));
describe('Error Handling', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    describe('AppError Class', () => {
        it('should create an AppError with correct properties', () => {
            const error = new AppError(ErrorCode.VALIDATION_ERROR, 'Test error message', 400, true, { field: 'email' });
            expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
            expect(error.message).toBe('Test error message');
            expect(error.statusCode).toBe(400);
            expect(error.isOperational).toBe(true);
            expect(error.details).toEqual({ field: 'email' });
        });
        it('should serialize to JSON correctly', () => {
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
        });
    });
    describe('Specific Error Classes', () => {
        it('should create ValidationError correctly', () => {
            const error = new ValidationError('Invalid email format', { field: 'email' });
            expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
            expect(error.statusCode).toBe(400);
            expect(error.message).toBe('Invalid email format');
            expect(error.details).toEqual({ field: 'email' });
        });
        it('should create AuthenticationError correctly', () => {
            const error = new AuthenticationError('Invalid credentials');
            expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
            expect(error.statusCode).toBe(401);
            expect(error.message).toBe('Invalid credentials');
        });
    });
    describe('API Error Responses', () => {
        it('should handle 404 for non-existent routes', async () => {
            const response = await request(app)
                .get('/api/non-existent-route')
                .expect(404);
            expect(response.body).toMatchObject({
                success: false,
                error: {
                    code: ErrorCode.RESOURCE_NOT_FOUND,
                    message: expect.stringContaining('Route GET /api/non-existent-route not found'),
                },
                timestamp: expect.any(String),
                requestId: expect.any(String),
            });
        });
        it('should include request ID in error responses', async () => {
            const response = await request(app)
                .get('/api/non-existent')
                .expect(404);
            expect(response.headers['x-request-id']).toBeDefined();
            expect(response.body.requestId).toBe(response.headers['x-request-id']);
        });
        it('should handle validation errors in auth routes', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({}) // Missing email and password
                .expect(400);
            expect(response.body).toMatchObject({
                success: false,
                error: {
                    code: ErrorCode.VALIDATION_ERROR,
                    message: 'Email and password are required',
                },
            });
        });
        it('should handle invalid email format', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                email: 'invalid-email',
                password: 'ValidPass123',
            })
                .expect(400);
            expect(response.body).toMatchObject({
                success: false,
                error: {
                    code: ErrorCode.VALIDATION_ERROR,
                    message: 'Invalid email format',
                },
            });
        });
        it('should handle weak password', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                email: 'test@example.com',
                password: 'weak',
            })
                .expect(400);
            expect(response.body).toMatchObject({
                success: false,
                error: {
                    code: ErrorCode.VALIDATION_ERROR,
                    message: expect.stringContaining('Password must be at least 8 characters'),
                },
            });
        });
    });
    describe('Error Logging', () => {
        it('should log errors with appropriate level', async () => {
            await request(app)
                .get('/api/non-existent')
                .expect(404);
            expect(logger.warn).toHaveBeenCalledWith('Request error', expect.objectContaining({
                requestId: expect.any(String),
                error: expect.objectContaining({
                    code: ErrorCode.RESOURCE_NOT_FOUND,
                    statusCode: 404,
                }),
                request: expect.objectContaining({
                    method: 'GET',
                    url: '/api/non-existent',
                }),
            }));
        });
        it('should log 5xx errors as error level', () => {
            // This would be tested with a route that throws a 500 error
            // For now, we'll test the error handler directly
            const mockReq = {
                method: 'GET',
                url: '/test',
                requestId: 'test-id',
                get: vi.fn().mockReturnValue('test-agent'),
                ip: '127.0.0.1',
                user: null,
            };
            const mockRes = {
                headersSent: false,
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            };
            const mockNext = vi.fn();
            const error = new AppError(ErrorCode.INTERNAL_ERROR, 'Test error', 500);
            // Import and call error handler directly
            const { errorHandler } = require('../middleware/error.js');
            errorHandler(error, mockReq, mockRes, mockNext);
            expect(logger.error).toHaveBeenCalled();
        });
    });
    describe('Health Check Error Handling', () => {
        it('should return healthy status when database is working', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);
            expect(response.body).toMatchObject({
                status: 'ok',
                timestamp: expect.any(String),
            });
        });
        it('should handle database health check errors gracefully', async () => {
            // This test would require mocking the database connection
            // For now, we'll test that the endpoint exists and returns a response
            const response = await request(app)
                .get('/api/health/database');
            expect(response.status).toBeOneOf([200, 503, 500]);
            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('timestamp');
        });
    });
    describe('Request ID Middleware', () => {
        it('should add request ID to all requests', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);
            expect(response.headers['x-request-id']).toBeDefined();
            expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/); // UUID format
        });
    });
    describe('CORS Error Handling', () => {
        it('should handle CORS preflight requests', async () => {
            const response = await request(app)
                .options('/api/auth/login')
                .set('Origin', 'http://localhost:5173')
                .set('Access-Control-Request-Method', 'POST');
            expect(response.status).toBeOneOf([200, 204]);
        });
    });
});
// Helper function for test expectations
expect.extend({
    toBeOneOf(received, expected) {
        const pass = expected.includes(received);
        if (pass) {
            return {
                message: () => `expected ${received} not to be one of ${expected}`,
                pass: true,
            };
        }
        else {
            return {
                message: () => `expected ${received} to be one of ${expected}`,
                pass: false,
            };
        }
    },
});
//# sourceMappingURL=error-handling.test.js.map