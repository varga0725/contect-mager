import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from '../config/passport.js';
import authRoutes from '../routes/auth.js';
import { AuthService } from '../services/auth.js';
// Mock the AuthService
vi.mock('../services/auth.js');
// Create test app
function createTestApp() {
    const app = express();
    app.use(express.json());
    app.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false }
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use('/api/auth', authRoutes);
    return app;
}
describe('Auth Routes', () => {
    let app;
    beforeEach(() => {
        vi.clearAllMocks();
        app = createTestApp();
    });
    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'TestPassword123'
            };
            const mockUser = {
                id: 1,
                email: userData.email,
                subscriptionTier: 'free',
                monthlyUsage: 0,
                usageResetDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            vi.mocked(AuthService.createUser).mockResolvedValue(mockUser);
            const response = await request(app)
                .post('/api/auth/register')
                .send(userData);
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(userData.email);
            expect(response.body.data.user.id).toBe(1);
        });
        it('should return 400 for missing email', async () => {
            const userData = {
                password: 'TestPassword123'
            };
            const response = await request(app)
                .post('/api/auth/register')
                .send(userData);
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });
        it('should return 400 for missing password', async () => {
            const userData = {
                email: 'test@example.com'
            };
            const response = await request(app)
                .post('/api/auth/register')
                .send(userData);
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });
        it('should return 400 for invalid email format', async () => {
            const userData = {
                email: 'invalid-email',
                password: 'TestPassword123'
            };
            const response = await request(app)
                .post('/api/auth/register')
                .send(userData);
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
            expect(response.body.error.message).toContain('Invalid email format');
        });
        it('should return 400 for weak password', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'weak'
            };
            const response = await request(app)
                .post('/api/auth/register')
                .send(userData);
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
            expect(response.body.error.message).toContain('Password must be at least 8 characters');
        });
        it('should return 409 for existing user', async () => {
            const userData = {
                email: 'existing@example.com',
                password: 'TestPassword123'
            };
            vi.mocked(AuthService.createUser).mockRejectedValue(new Error('User already exists with this email'));
            const response = await request(app)
                .post('/api/auth/register')
                .send(userData);
            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('USER_EXISTS');
        });
    });
    describe('POST /api/auth/login', () => {
        it('should return 400 for missing credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({});
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });
        it('should return 401 for invalid credentials', async () => {
            vi.mocked(AuthService.authenticateUser).mockResolvedValue(null);
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                email: 'test@example.com',
                password: 'wrongpassword'
            });
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
        });
    });
    describe('POST /api/auth/logout', () => {
        it('should return 401 for unauthenticated user', async () => {
            const response = await request(app)
                .post('/api/auth/logout');
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('UNAUTHORIZED');
        });
    });
    describe('GET /api/auth/me', () => {
        it('should return 401 for unauthenticated user', async () => {
            const response = await request(app)
                .get('/api/auth/me');
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('UNAUTHORIZED');
        });
    });
});
//# sourceMappingURL=auth.routes.test.js.map