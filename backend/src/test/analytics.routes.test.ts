import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { db } from '../config/database.js';
import { users, posts, analytics } from '../models/schema.js';
import { eq } from 'drizzle-orm';

describe('Analytics Routes', () => {
  let testUser: { id: number; email: string };
  let testPosts: Array<{ id: number; platform: string; contentType: string }>;
  let agent: request.SuperTest<request.Test>;

  beforeEach(async () => {
    // Create test user
    const [user] = await db.insert(users).values({
      email: 'analytics@test.com',
      passwordHash: 'hashedpassword',
      subscriptionTier: 'pro',
    }).returning();
    testUser = user;

    // Create test posts
    const postsData = [
      {
        userId: testUser.id,
        platform: 'instagram',
        contentType: 'image',
        contentData: { imageUrl: 'test.jpg' },
      },
      {
        userId: testUser.id,
        platform: 'tiktok',
        contentType: 'video',
        contentData: { videoUrl: 'test.mp4' },
      },
      {
        userId: testUser.id,
        platform: 'instagram',
        contentType: 'caption',
        contentData: { text: 'Test caption' },
      },
    ];

    testPosts = await db.insert(posts).values(postsData).returning();

    // Create test analytics data
    const analyticsData = [];
    for (const post of testPosts) {
      analyticsData.push(
        { postId: post.id, metricType: 'views', metricValue: 100 + Math.floor(Math.random() * 500) },
        { postId: post.id, metricType: 'likes', metricValue: 10 + Math.floor(Math.random() * 50) },
        { postId: post.id, metricType: 'shares', metricValue: Math.floor(Math.random() * 10) },
        { postId: post.id, metricType: 'comments', metricValue: Math.floor(Math.random() * 20) }
      );
    }

    await db.insert(analytics).values(analyticsData);

    // Create authenticated agent
    agent = request.agent(app);
    await agent
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'password' });
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(analytics).where(eq(analytics.postId, testPosts[0].id));
    await db.delete(posts).where(eq(posts.userId, testUser.id));
    await db.delete(users).where(eq(users.id, testUser.id));
  });

  describe('GET /api/analytics/overview', () => {
    it('should return analytics overview for authenticated user', async () => {
      const response = await agent
        .get('/api/analytics/overview')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('overview');
      expect(response.body.data).toHaveProperty('platformBreakdown');
      
      const { overview, platformBreakdown } = response.body.data;
      
      expect(overview.totalPosts).toBe(testPosts.length);
      expect(overview.metrics).toHaveProperty('views');
      expect(overview.metrics).toHaveProperty('likes');
      expect(overview.metrics).toHaveProperty('shares');
      expect(overview.metrics).toHaveProperty('comments');
      
      expect(Array.isArray(platformBreakdown)).toBe(true);
      expect(platformBreakdown.length).toBeGreaterThan(0);
    });

    it('should filter by platform', async () => {
      const response = await agent
        .get('/api/analytics/overview?platform=instagram')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const { platformBreakdown } = response.body.data;
      const instagramData = platformBreakdown.find((p: any) => p.platform === 'instagram');
      expect(instagramData).toBeDefined();
      expect(instagramData.count).toBe(2); // 2 Instagram posts
    });

    it('should filter by date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      const response = await agent
        .get(`/api/analytics/overview?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overview.totalPosts).toBe(testPosts.length);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/analytics/overview')
        .expect(401);
    });
  });

  describe('GET /api/analytics/performance', () => {
    it('should return performance metrics', async () => {
      const response = await agent
        .get('/api/analytics/performance')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('timeSeries');
      expect(response.body.data).toHaveProperty('topPosts');
      expect(response.body.data).toHaveProperty('metricType');
      
      expect(Array.isArray(response.body.data.timeSeries)).toBe(true);
      expect(Array.isArray(response.body.data.topPosts)).toBe(true);
      expect(response.body.data.metricType).toBe('views'); // default metric
    });

    it('should filter by metric type', async () => {
      const response = await agent
        .get('/api/analytics/performance?metricType=likes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.metricType).toBe('likes');
    });

    it('should return top posts ordered by performance', async () => {
      const response = await agent
        .get('/api/analytics/performance')
        .expect(200);

      const { topPosts } = response.body.data;
      
      if (topPosts.length > 1) {
        // Check that posts are ordered by totalValue descending
        for (let i = 0; i < topPosts.length - 1; i++) {
          expect(topPosts[i].totalValue).toBeGreaterThanOrEqual(topPosts[i + 1].totalValue);
        }
      }
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/analytics/performance')
        .expect(401);
    });
  });

  describe('GET /api/analytics/trends', () => {
    it('should return trends data', async () => {
      const response = await agent
        .get('/api/analytics/trends')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('trends');
      expect(response.body.data).toHaveProperty('growthRates');
      expect(response.body.data).toHaveProperty('period');
      
      expect(Array.isArray(response.body.data.trends)).toBe(true);
      expect(typeof response.body.data.growthRates).toBe('object');
      expect(response.body.data.period).toBe('30 days'); // default period
    });

    it('should accept custom period', async () => {
      const response = await agent
        .get('/api/analytics/trends?days=7')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.period).toBe('7 days');
    });

    it('should calculate growth rates', async () => {
      // Add some historical data to test growth calculation
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      await db.insert(analytics).values([
        { postId: testPosts[0].id, metricType: 'views', metricValue: 50 },
        { postId: testPosts[0].id, metricType: 'likes', metricValue: 5 },
      ]);

      const response = await agent
        .get('/api/analytics/trends?days=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(typeof response.body.data.growthRates).toBe('object');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/analytics/trends')
        .expect(401);
    });
  });

  describe('POST /api/analytics/metrics', () => {
    it('should record analytics metrics for user post', async () => {
      const metricsData = {
        postId: testPosts[0].id,
        metrics: [
          { type: 'views', value: 150 },
          { type: 'likes', value: 25 },
        ],
      };

      const response = await agent
        .post('/api/analytics/metrics')
        .send(metricsData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Analytics metrics recorded successfully');

      // Verify metrics were stored
      const storedMetrics = await db
        .select()
        .from(analytics)
        .where(eq(analytics.postId, testPosts[0].id));

      const viewsMetrics = storedMetrics.filter(m => m.metricType === 'views');
      const likesMetrics = storedMetrics.filter(m => m.metricType === 'likes');
      
      expect(viewsMetrics.length).toBeGreaterThan(1); // Original + new
      expect(likesMetrics.length).toBeGreaterThan(1); // Original + new
    });

    it('should reject metrics for non-existent post', async () => {
      const metricsData = {
        postId: 99999,
        metrics: [{ type: 'views', value: 150 }],
      };

      const response = await agent
        .post('/api/analytics/metrics')
        .send(metricsData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Post not found');
    });

    it('should reject metrics for other user\'s post', async () => {
      // Create another user and post
      const [otherUser] = await db.insert(users).values({
        email: 'other@test.com',
        passwordHash: 'hashedpassword',
      }).returning();

      const [otherPost] = await db.insert(posts).values({
        userId: otherUser.id,
        platform: 'instagram',
        contentType: 'image',
        contentData: { imageUrl: 'other.jpg' },
      }).returning();

      const metricsData = {
        postId: otherPost.id,
        metrics: [{ type: 'views', value: 150 }],
      };

      const response = await agent
        .post('/api/analytics/metrics')
        .send(metricsData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Post not found');

      // Clean up
      await db.delete(posts).where(eq(posts.id, otherPost.id));
      await db.delete(users).where(eq(users.id, otherUser.id));
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/analytics/metrics')
        .send({ postId: testPosts[0].id, metrics: [] })
        .expect(401);
    });
  });
});