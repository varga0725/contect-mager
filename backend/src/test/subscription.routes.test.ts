import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';

import app from '../index.js';
import { db } from '../config/database.js';
import { users } from '../models/schema.js';


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
        constructEvent: vi.fn().mockReturnValue({
          type: 'customer.subscription.created',
          data: {
            object: {
              id: 'sub_test123',
              status: 'active',
              current_period_start: Math.floor(Date.now() / 1000),
              current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
              metadata: {
                userId: '1',
                tier: 'pro',
              },
            },
          },
        }),
      },
    })),
  };
});

describe('Subscription Routes', () => {
  let authCookie: string;

  beforeEach(async () => {
    // Create test user
    const [user] = await db.insert(users).values({
      email: 'test@example.com',
      passwordHash: '$2b$10$test.hash.for.testing.purposes.only',
      subscriptionTier: 'free',
      monthlyUsage: 0,
    }).returning();
    if (!user) throw new Error('Failed to create test user');

    // Login to get session cookie
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword',
      });

    const cookies = loginResponse.headers['set-cookie'];
    if (!cookies || !cookies[0]) throw new Error('No auth cookie received');
    authCookie = cookies[0];
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(users);
  });

  describe('GET /api/subscription/status', () => {
    it('should return subscription status for authenticated user', async () => {
      const response = await request(app)
        .get('/api/subscription/status')
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('usage');
      expect(response.body.data.usage.tier).toBe('free');
      expect(response.body.data.usage.monthlyLimit).toBe(10);
    });

    it('should return 401 for unauthenticated user', async () => {
      const response = await request(app)
        .get('/api/subscription/status');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/subscription/usage', () => {
    it('should return usage statistics', async () => {
      const response = await request(app)
        .get('/api/subscription/usage')
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('currentUsage');
      expect(response.body.data).toHaveProperty('monthlyLimit');
      expect(response.body.data).toHaveProperty('tier');
      expect(response.body.data).toHaveProperty('remainingPosts');
    });
  });

  describe('POST /api/subscription/checkout', () => {
    it('should create checkout session for valid tier', async () => {
      const response = await request(app)
        .post('/api/subscription/checkout')
        .set('Cookie', authCookie)
        .send({
          tier: 'pro',
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sessionId');
      expect(response.body.data).toHaveProperty('url');
    });

    it('should return 400 for invalid tier', async () => {
      const response = await request(app)
        .post('/api/subscription/checkout')
        .set('Cookie', authCookie)
        .send({
          tier: 'invalid',
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TIER');
    });

    it('should return 400 for missing URLs', async () => {
      const response = await request(app)
        .post('/api/subscription/checkout')
        .set('Cookie', authCookie)
        .send({
          tier: 'pro',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_URLS');
    });
  });

  describe('POST /api/subscription/webhook', () => {
    it('should handle subscription created webhook', async () => {
      const response = await request(app)
        .post('/api/subscription/webhook')
        .set('stripe-signature', 'test-signature')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.received).toBe(true);
    });
  });

  describe('POST /api/subscription/cancel', () => {
    it('should return error when no subscription exists', async () => {
      const response = await request(app)
        .post('/api/subscription/cancel')
        .set('Cookie', authCookie);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CANCEL_ERROR');
    });
  });
});