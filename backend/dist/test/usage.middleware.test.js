import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { users } from '../models/schema.js';
import { checkUsageLimit, incrementUsage } from '../middleware/usage.js';
import { SUBSCRIPTION_LIMITS } from '../services/subscription.js';
describe('Usage Middleware', () => {
    let testUser;
    let req;
    let res;
    let next;
    beforeEach(async () => {
        // Create test user
        const [user] = await db.insert(users).values({
            email: 'test@example.com',
            passwordHash: 'hashedpassword',
            subscriptionTier: 'free',
            monthlyUsage: 0,
        }).returning();
        if (!user)
            throw new Error('Failed to create test user');
        testUser = user;
        // Mock request, response, and next
        req = {
            user: testUser,
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
        next = vi.fn();
    });
    afterEach(async () => {
        // Clean up test data
        await db.delete(users);
        vi.clearAllMocks();
    });
    describe('checkUsageLimit', () => {
        it('should call next() when user can generate content', async () => {
            await checkUsageLimit(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
        it('should return 401 when user is not authenticated', async () => {
            req.user = undefined;
            await checkUsageLimit(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required',
                },
            });
            expect(next).not.toHaveBeenCalled();
        });
        it('should return 403 when usage limit is exceeded', async () => {
            // Set user usage to limit
            await db.update(users)
                .set({ monthlyUsage: SUBSCRIPTION_LIMITS.free.monthlyPosts })
                .where(eq(users.id, testUser.id));
            await checkUsageLimit(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'USAGE_LIMIT_EXCEEDED',
                    message: expect.stringContaining('Monthly limit'),
                },
            });
            expect(next).not.toHaveBeenCalled();
        });
        it('should handle errors gracefully', async () => {
            // Use invalid user ID to trigger error
            req.user = { id: 99999 };
            await checkUsageLimit(req, res, next);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'USAGE_CHECK_ERROR',
                    message: 'Failed to check usage limits',
                },
            });
            expect(next).not.toHaveBeenCalled();
        });
    });
    describe('incrementUsage', () => {
        it('should increment usage and call next()', async () => {
            await incrementUsage(req, res, next);
            // Check that usage was incremented
            const updatedUser = await db.query.users.findFirst({
                where: eq(users.id, testUser.id),
            });
            expect(updatedUser?.monthlyUsage).toBe(1);
            expect(next).toHaveBeenCalled();
        });
        it('should call next() even when user is not authenticated', async () => {
            req.user = undefined;
            await incrementUsage(req, res, next);
            expect(next).toHaveBeenCalled();
        });
        it('should call next() even when increment fails', async () => {
            // Use invalid user ID to trigger error
            req.user = { id: 99999 };
            await incrementUsage(req, res, next);
            // Should still call next() even on error
            expect(next).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=usage.middleware.test.js.map