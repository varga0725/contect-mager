import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { users, subscriptions } from '../models/schema.js';
import { SubscriptionService, SUBSCRIPTION_LIMITS } from '../services/subscription.js';
import type { User } from '../types/database.js';

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

describe('SubscriptionService', () => {
  let testUser: User;

  beforeEach(async () => {
    // Create test user
    const [user] = await db.insert(users).values({
      email: 'test@example.com',
      passwordHash: 'hashedpassword',
      subscriptionTier: 'free',
      monthlyUsage: 0,
    }).returning();
    if (!user) throw new Error('Failed to create test user');
    testUser = user;
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(subscriptions);
    await db.delete(users);
  });

  describe('getUserSubscription', () => {
    it('should return user with subscription data', async () => {
      const result = await SubscriptionService.getUserSubscription(testUser.id);
      
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(testUser.id);
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw error for non-existent user', async () => {
      await expect(SubscriptionService.getUserSubscription(99999))
        .rejects.toThrow('User not found');
    });
  });

  describe('canGenerateContent', () => {
    it('should allow content generation for free user within limits', async () => {
      const result = await SubscriptionService.canGenerateContent(testUser.id);
      
      expect(result.canGenerate).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should deny content generation when limit is reached', async () => {
      // Set user usage to limit
      await db.update(users)
        .set({ monthlyUsage: SUBSCRIPTION_LIMITS.free.monthlyPosts })
        .where(eq(users.id, testUser.id));

      const result = await SubscriptionService.canGenerateContent(testUser.id);
      
      expect(result.canGenerate).toBe(false);
      expect(result.reason).toContain('Monthly limit');
    });

    it('should reset usage when reset date has passed', async () => {
      // Set user usage to limit with past reset date
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 1);
      
      await db.update(users)
        .set({ 
          monthlyUsage: SUBSCRIPTION_LIMITS.free.monthlyPosts,
          usageResetDate: pastDate,
        })
        .where(eq(users.id, testUser.id));

      const result = await SubscriptionService.canGenerateContent(testUser.id);
      
      expect(result.canGenerate).toBe(true);
    });
  });

  describe('incrementUsage', () => {
    it('should increment user monthly usage', async () => {
      await SubscriptionService.incrementUsage(testUser.id);
      
      const updatedUser = await db.query.users.findFirst({
        where: eq(users.id, testUser.id),
      });
      
      expect(updatedUser?.monthlyUsage).toBe(1);
    });

    it('should throw error for non-existent user', async () => {
      await expect(SubscriptionService.incrementUsage(99999))
        .rejects.toThrow('User not found');
    });
  });

  describe('resetMonthlyUsage', () => {
    it('should reset usage and update reset date', async () => {
      // Set some usage first
      await db.update(users)
        .set({ monthlyUsage: 5 })
        .where(eq(users.id, testUser.id));

      await SubscriptionService.resetMonthlyUsage(testUser.id);
      
      const updatedUser = await db.query.users.findFirst({
        where: eq(users.id, testUser.id),
      });
      
      expect(updatedUser?.monthlyUsage).toBe(0);
      expect(updatedUser?.usageResetDate.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session for pro tier', async () => {
      const result = await SubscriptionService.createCheckoutSession(
        testUser.id,
        'pro',
        'https://example.com/success',
        'https://example.com/cancel'
      );
      
      expect(result.sessionId).toBe('cs_test123');
      expect(result.url).toBe('https://checkout.stripe.com/test');
    });

    it('should throw error for free tier', async () => {
      await expect(SubscriptionService.createCheckoutSession(
        testUser.id,
        'free',
        'https://example.com/success',
        'https://example.com/cancel'
      )).rejects.toThrow('Cannot create checkout session for free tier');
    });
  });

  describe('getUsageStats', () => {
    it('should return correct usage statistics', async () => {
      await db.update(users)
        .set({ monthlyUsage: 3 })
        .where(eq(users.id, testUser.id));

      const stats = await SubscriptionService.getUsageStats(testUser.id);
      
      expect(stats.currentUsage).toBe(3);
      expect(stats.monthlyLimit).toBe(SUBSCRIPTION_LIMITS.free.monthlyPosts);
      expect(stats.tier).toBe('free');
      expect(stats.remainingPosts).toBe(SUBSCRIPTION_LIMITS.free.monthlyPosts - 3);
    });
  });

  describe('handleSubscriptionCreated', () => {
    it('should create subscription record and update user tier', async () => {
      const mockSubscription = {
        id: 'sub_test123',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        metadata: {
          userId: testUser.id.toString(),
          tier: 'pro',
        },
      } as any;

      await SubscriptionService.handleSubscriptionCreated(mockSubscription);
      
      // Check subscription was created
      const subscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.stripeSubscriptionId, 'sub_test123'),
      });
      expect(subscription).toBeDefined();
      expect(subscription?.userId).toBe(testUser.id);
      
      // Check user tier was updated
      const updatedUser = await db.query.users.findFirst({
        where: eq(users.id, testUser.id),
      });
      expect(updatedUser?.subscriptionTier).toBe('pro');
    });
  });
});