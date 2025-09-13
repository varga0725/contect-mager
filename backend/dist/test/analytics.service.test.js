import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../config/database.js';
import { users, posts, analytics } from '../models/schema.js';
import { AnalyticsService } from '../services/analytics.js';
import { eq } from 'drizzle-orm';
describe('AnalyticsService', () => {
    let testUser;
    let testPost;
    beforeEach(async () => {
        // Create test user
        const [user] = await db.insert(users).values({
            email: 'analytics-service@test.com',
            passwordHash: 'hashedpassword',
        }).returning();
        testUser = user;
        // Create test post
        const [post] = await db.insert(posts).values({
            userId: testUser.id,
            platform: 'instagram',
            contentType: 'image',
            contentData: { imageUrl: 'test.jpg' },
        }).returning();
        testPost = post;
    });
    afterEach(async () => {
        // Clean up test data
        await db.delete(analytics).where(eq(analytics.postId, testPost.id));
        await db.delete(posts).where(eq(posts.id, testPost.id));
        await db.delete(users).where(eq(users.id, testUser.id));
    });
    describe('initializePostAnalytics', () => {
        it('should create baseline analytics for a new post', async () => {
            await AnalyticsService.initializePostAnalytics(testPost.id);
            const metrics = await db
                .select()
                .from(analytics)
                .where(eq(analytics.postId, testPost.id));
            expect(metrics.length).toBe(4); // views, likes, shares, comments
            const metricTypes = metrics.map(m => m.metricType);
            expect(metricTypes).toContain('views');
            expect(metricTypes).toContain('likes');
            expect(metricTypes).toContain('shares');
            expect(metricTypes).toContain('comments');
            // Check that values are within expected ranges
            const viewsMetric = metrics.find(m => m.metricType === 'views');
            const likesMetric = metrics.find(m => m.metricType === 'likes');
            const sharesMetric = metrics.find(m => m.metricType === 'shares');
            const commentsMetric = metrics.find(m => m.metricType === 'comments');
            expect(viewsMetric?.metricValue).toBeGreaterThanOrEqual(10);
            expect(viewsMetric?.metricValue).toBeLessThanOrEqual(60);
            expect(likesMetric?.metricValue).toBeGreaterThanOrEqual(1);
            expect(likesMetric?.metricValue).toBeLessThanOrEqual(11);
            expect(sharesMetric?.metricValue).toBeGreaterThanOrEqual(0);
            expect(sharesMetric?.metricValue).toBeLessThanOrEqual(3);
            expect(commentsMetric?.metricValue).toBeGreaterThanOrEqual(0);
            expect(commentsMetric?.metricValue).toBeLessThanOrEqual(5);
        });
        it('should handle errors gracefully', async () => {
            // Test with invalid post ID - should not throw
            await expect(AnalyticsService.initializePostAnalytics(-1)).resolves.toBeUndefined();
        });
    });
    describe('simulateMetricGrowth', () => {
        beforeEach(async () => {
            // Initialize baseline metrics
            await AnalyticsService.initializePostAnalytics(testPost.id);
        });
        it('should add growth metrics to existing post', async () => {
            const initialMetrics = await db
                .select()
                .from(analytics)
                .where(eq(analytics.postId, testPost.id));
            await AnalyticsService.simulateMetricGrowth(testPost.id);
            const afterGrowthMetrics = await db
                .select()
                .from(analytics)
                .where(eq(analytics.postId, testPost.id));
            // Should have more metrics after growth simulation
            expect(afterGrowthMetrics.length).toBeGreaterThan(initialMetrics.length);
        });
        it('should handle post with no existing metrics', async () => {
            // Create a new post without analytics
            const [newPost] = await db.insert(posts).values({
                userId: testUser.id,
                platform: 'tiktok',
                contentType: 'video',
                contentData: { videoUrl: 'test.mp4' },
            }).returning();
            // Should not throw error
            await expect(AnalyticsService.simulateMetricGrowth(newPost.id)).resolves.toBeUndefined();
            // Clean up
            await db.delete(posts).where(eq(posts.id, newPost.id));
        });
    });
    describe('getPostMetrics', () => {
        beforeEach(async () => {
            // Add some test metrics
            await db.insert(analytics).values([
                { postId: testPost.id, metricType: 'views', metricValue: 100 },
                { postId: testPost.id, metricType: 'views', metricValue: 50 },
                { postId: testPost.id, metricType: 'likes', metricValue: 10 },
                { postId: testPost.id, metricType: 'likes', metricValue: 5 },
                { postId: testPost.id, metricType: 'shares', metricValue: 2 },
            ]);
        });
        it('should return aggregated metrics for a post', async () => {
            const metrics = await AnalyticsService.getPostMetrics(testPost.id);
            expect(metrics).toHaveProperty('views');
            expect(metrics).toHaveProperty('likes');
            expect(metrics).toHaveProperty('shares');
            expect(metrics.views).toBe(150); // 100 + 50
            expect(metrics.likes).toBe(15); // 10 + 5
            expect(metrics.shares).toBe(2);
        });
        it('should return empty object for post with no metrics', async () => {
            // Create a new post without analytics
            const [newPost] = await db.insert(posts).values({
                userId: testUser.id,
                platform: 'linkedin',
                contentType: 'caption',
                contentData: { text: 'Test' },
            }).returning();
            const metrics = await AnalyticsService.getPostMetrics(newPost.id);
            expect(metrics).toEqual({});
            // Clean up
            await db.delete(posts).where(eq(posts.id, newPost.id));
        });
        it('should handle invalid post ID', async () => {
            const metrics = await AnalyticsService.getPostMetrics(-1);
            expect(metrics).toEqual({});
        });
    });
    describe('recordMetric', () => {
        it('should record a custom metric', async () => {
            await AnalyticsService.recordMetric(testPost.id, 'custom_metric', 42);
            const metrics = await db
                .select()
                .from(analytics)
                .where(eq(analytics.postId, testPost.id));
            const customMetric = metrics.find(m => m.metricType === 'custom_metric');
            expect(customMetric).toBeDefined();
            expect(customMetric?.metricValue).toBe(42);
        });
        it('should throw error for database issues', async () => {
            // Test with invalid post ID that would cause foreign key constraint error
            await expect(AnalyticsService.recordMetric(-1, 'test', 1)).rejects.toThrow();
        });
    });
});
//# sourceMappingURL=analytics.service.test.js.map