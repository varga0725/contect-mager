import { describe, it, expect, vi } from 'vitest';
import { SubscriptionService, SUBSCRIPTION_LIMITS } from '../services/subscription.js';
// Mock Stripe
vi.mock('stripe', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            prices: {
                create: vi.fn().mockResolvedValue({ id: 'price_test123' }),
            },
            checkout: {
                sessions: {
                    create: vi.fn().mockResolvedValue({
                        id: 'cs_test123',
                        url: 'https://checkout.stripe.com/test',
                    }),
                },
            },
            subscriptions: {
                cancel: vi.fn().mockResolvedValue({ id: 'sub_test123' }),
            },
            webhooks: {
                constructEvent: vi.fn(),
            },
        })),
    };
});
// Mock database
vi.mock('../config/database.js', () => ({
    db: {
        query: {
            users: {
                findFirst: vi.fn().mockResolvedValue({
                    id: 1,
                    email: 'test@example.com',
                    subscriptionTier: 'free',
                    monthlyUsage: 0,
                    usageResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                }),
            },
        },
        update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue(undefined),
            }),
        }),
        insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 1 }]),
            }),
        }),
    },
}));
describe('Subscription Integration Tests', () => {
    describe('SUBSCRIPTION_LIMITS', () => {
        it('should have correct subscription limits', () => {
            expect(SUBSCRIPTION_LIMITS.free.monthlyPosts).toBe(10);
            expect(SUBSCRIPTION_LIMITS.pro.monthlyPosts).toBe(100);
            expect(SUBSCRIPTION_LIMITS.creator.monthlyPosts).toBe(500);
            expect(SUBSCRIPTION_LIMITS.free.price).toBe(0);
            expect(SUBSCRIPTION_LIMITS.pro.price).toBe(1999);
            expect(SUBSCRIPTION_LIMITS.creator.price).toBe(4999);
        });
    });
    describe('SubscriptionService.canGenerateContent', () => {
        it('should allow content generation for user within limits', async () => {
            const result = await SubscriptionService.canGenerateContent(1);
            expect(result.canGenerate).toBe(true);
            expect(result.reason).toBeUndefined();
        });
    });
    describe('SubscriptionService.createCheckoutSession', () => {
        it('should create checkout session with correct parameters', async () => {
            const result = await SubscriptionService.createCheckoutSession(1, 'pro', 'https://example.com/success', 'https://example.com/cancel');
            expect(result.sessionId).toBe('cs_test123');
            expect(result.url).toBe('https://checkout.stripe.com/test');
        });
        it('should throw error for free tier', async () => {
            await expect(SubscriptionService.createCheckoutSession(1, 'free', 'https://example.com/success', 'https://example.com/cancel')).rejects.toThrow('Cannot create checkout session for free tier');
        });
    });
    describe('SubscriptionService.getUsageStats', () => {
        it('should return correct usage statistics', async () => {
            const stats = await SubscriptionService.getUsageStats(1);
            expect(stats.currentUsage).toBe(0);
            expect(stats.monthlyLimit).toBe(10);
            expect(stats.tier).toBe('free');
            expect(stats.remainingPosts).toBe(10);
            expect(stats.resetDate).toBeInstanceOf(Date);
        });
    });
});
//# sourceMappingURL=subscription.integration.test.js.map