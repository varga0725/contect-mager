import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { createApp } from '../../index';

describe('Complete User Flow Integration Tests', () => {
  let app: express.Application;
  let agent: request.SuperAgentTest;

  beforeEach(async () => {
    // Create test app with in-memory session store
    app = express();
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }
    }));
    
    // Mock database operations
    vi.mock('../../config/database', () => ({
      db: {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 1, email: 'test@example.com' }])
          })
        }),
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ id: 1, email: 'test@example.com', password_hash: 'hashed' }])
          })
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ id: 1 }])
          })
        })
      }
    }));

    // Create supertest agent for session persistence
    agent = request.agent(app);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('User Registration and Authentication Flow', () => {
    it('should complete full registration and login flow', async () => {
      // Step 1: Register new user
      const registerResponse = await agent
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123'
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.user.email).toBe('newuser@example.com');

      // Step 2: Login with new credentials
      const loginResponse = await agent
        .post('/api/auth/login')
        .send({
          email: 'newuser@example.com',
          password: 'password123'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.user.email).toBe('newuser@example.com');

      // Step 3: Access protected route
      const profileResponse = await agent.get('/api/auth/me');
      
      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.user.email).toBe('newuser@example.com');

      // Step 4: Logout
      const logoutResponse = await agent.post('/api/auth/logout');
      
      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.success).toBe(true);

      // Step 5: Verify logout by accessing protected route
      const unauthorizedResponse = await agent.get('/api/auth/me');
      
      expect(unauthorizedResponse.status).toBe(401);
    });
  });

  describe('Content Generation Flow', () => {
    beforeEach(async () => {
      // Login user for content tests
      await agent
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
    });

    it('should complete full content generation and management flow', async () => {
      // Mock AI services
      vi.mock('../../services/ai/gemini', () => ({
        GeminiService: vi.fn().mockImplementation(() => ({
          generateCaption: vi.fn().mockResolvedValue({
            caption: 'Generated test caption',
            hashtags: ['#test', '#ai']
          })
        }))
      }));

      // Step 1: Generate caption
      const captionResponse = await agent
        .post('/api/content/generate-caption')
        .send({
          prompt: 'A beautiful sunset',
          platform: 'instagram',
          tone: 'casual',
          includeHashtags: true
        });

      expect(captionResponse.status).toBe(200);
      expect(captionResponse.body.success).toBe(true);
      expect(captionResponse.body.content.caption).toBeTruthy();

      const contentId = captionResponse.body.content.id;

      // Step 2: View content library
      const libraryResponse = await agent.get('/api/content/library');
      
      expect(libraryResponse.status).toBe(200);
      expect(libraryResponse.body.success).toBe(true);
      expect(libraryResponse.body.content).toBeInstanceOf(Array);

      // Step 3: Schedule content
      const scheduleResponse = await agent
        .post('/api/schedule')
        .send({
          postId: contentId,
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

      expect(scheduleResponse.status).toBe(201);
      expect(scheduleResponse.body.success).toBe(true);

      // Step 4: View scheduled content
      const scheduledResponse = await agent.get('/api/schedule');
      
      expect(scheduledResponse.status).toBe(200);
      expect(scheduledResponse.body.success).toBe(true);
      expect(scheduledResponse.body.scheduled).toBeInstanceOf(Array);

      // Step 5: Delete content
      const deleteResponse = await agent.delete(`/api/content/${contentId}`);
      
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);
    });
  });

  describe('Subscription Management Flow', () => {
    beforeEach(async () => {
      // Login user for subscription tests
      await agent
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
    });

    it('should complete subscription upgrade and usage tracking flow', async () => {
      // Step 1: Check initial subscription status
      const statusResponse = await agent.get('/api/subscription/status');
      
      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.success).toBe(true);
      expect(statusResponse.body.subscription.tier).toBe('free');

      // Step 2: Check usage limits
      const usageResponse = await agent.get('/api/subscription/usage');
      
      expect(usageResponse.status).toBe(200);
      expect(usageResponse.body.success).toBe(true);
      expect(usageResponse.body.usage.monthlyUsage).toBeDefined();

      // Step 3: Attempt to upgrade subscription
      const upgradeResponse = await agent
        .post('/api/subscription/upgrade')
        .send({
          tier: 'pro'
        });

      // This would normally redirect to Stripe, but we'll mock success
      expect(upgradeResponse.status).toBe(200);
      expect(upgradeResponse.body.success).toBe(true);

      // Step 4: Verify upgraded status
      const updatedStatusResponse = await agent.get('/api/subscription/status');
      
      expect(updatedStatusResponse.status).toBe(200);
      expect(updatedStatusResponse.body.subscription.tier).toBe('pro');
    });

    it('should enforce usage limits correctly', async () => {
      // Mock user with high usage
      vi.mock('../../config/database', () => ({
        db: {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ 
                id: 1, 
                email: 'test@example.com', 
                subscription_tier: 'free',
                monthly_usage: 10 // At limit for free tier
              }])
            })
          })
        }
      }));

      // Attempt to generate content when at limit
      const limitResponse = await agent
        .post('/api/content/generate-caption')
        .send({
          prompt: 'Test prompt',
          platform: 'instagram',
          tone: 'casual'
        });

      expect(limitResponse.status).toBe(429);
      expect(limitResponse.body.error.code).toBe('USAGE_LIMIT_EXCEEDED');
    });
  });

  describe('Analytics Flow', () => {
    beforeEach(async () => {
      // Login user for analytics tests
      await agent
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
    });

    it('should track and display analytics correctly', async () => {
      // Step 1: Generate content (which should initialize analytics)
      const contentResponse = await agent
        .post('/api/content/generate-caption')
        .send({
          prompt: 'Analytics test',
          platform: 'instagram',
          tone: 'casual'
        });

      expect(contentResponse.status).toBe(200);
      const contentId = contentResponse.body.content.id;

      // Step 2: View analytics overview
      const overviewResponse = await agent.get('/api/analytics/overview');
      
      expect(overviewResponse.status).toBe(200);
      expect(overviewResponse.body.success).toBe(true);
      expect(overviewResponse.body.analytics).toBeDefined();

      // Step 3: View performance metrics
      const performanceResponse = await agent
        .get('/api/analytics/performance')
        .query({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        });

      expect(performanceResponse.status).toBe(200);
      expect(performanceResponse.body.success).toBe(true);
      expect(performanceResponse.body.metrics).toBeInstanceOf(Array);

      // Step 4: View trends
      const trendsResponse = await agent.get('/api/analytics/trends');
      
      expect(trendsResponse.status).toBe(200);
      expect(trendsResponse.body.success).toBe(true);
      expect(trendsResponse.body.trends).toBeDefined();
    });
  });

  describe('Error Handling in User Flows', () => {
    it('should handle authentication errors gracefully', async () => {
      // Attempt to access protected route without authentication
      const unauthorizedResponse = await agent.get('/api/content/library');
      
      expect(unauthorizedResponse.status).toBe(401);
      expect(unauthorizedResponse.body.error.code).toBe('UNAUTHORIZED');

      // Attempt login with invalid credentials
      const invalidLoginResponse = await agent
        .post('/api/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'wrongpassword'
        });

      expect(invalidLoginResponse.status).toBe(401);
      expect(invalidLoginResponse.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should handle validation errors in content generation', async () => {
      // Login first
      await agent
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      // Attempt content generation with invalid data
      const invalidContentResponse = await agent
        .post('/api/content/generate-caption')
        .send({
          // Missing required fields
          platform: 'invalid-platform'
        });

      expect(invalidContentResponse.status).toBe(400);
      expect(invalidContentResponse.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});