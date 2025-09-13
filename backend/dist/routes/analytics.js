import express from 'express';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { analytics, posts } from '../models/schema.js';
import { requireAuth } from '../middleware/auth.js';
const router = express.Router();
// Get analytics overview
router.get('/overview', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate, platform } = req.query;
        // Build base query conditions
        const conditions = [eq(posts.userId, userId)];
        if (startDate) {
            conditions.push(gte(analytics.recordedAt, new Date(startDate)));
        }
        if (endDate) {
            conditions.push(lte(analytics.recordedAt, new Date(endDate)));
        }
        if (platform) {
            conditions.push(eq(posts.platform, platform));
        }
        // Get total metrics by type
        const metricsQuery = db
            .select({
            metricType: analytics.metricType,
            totalValue: sql `sum(${analytics.metricValue})`,
            count: sql `count(*)`,
        })
            .from(analytics)
            .innerJoin(posts, eq(analytics.postId, posts.id))
            .where(and(...conditions))
            .groupBy(analytics.metricType);
        const metrics = await metricsQuery;
        // Get total posts count
        const totalPostsQuery = db
            .select({
            count: sql `count(*)`,
        })
            .from(posts)
            .where(eq(posts.userId, userId));
        const totalPosts = await totalPostsQuery;
        // Get platform breakdown
        const platformQuery = db
            .select({
            platform: posts.platform,
            count: sql `count(*)`,
            totalViews: sql `coalesce(sum(case when ${analytics.metricType} = 'views' then ${analytics.metricValue} else 0 end), 0)`,
            totalLikes: sql `coalesce(sum(case when ${analytics.metricType} = 'likes' then ${analytics.metricValue} else 0 end), 0)`,
        })
            .from(posts)
            .leftJoin(analytics, eq(posts.id, analytics.postId))
            .where(eq(posts.userId, userId))
            .groupBy(posts.platform);
        const platformBreakdown = await platformQuery;
        res.json({
            success: true,
            data: {
                overview: {
                    totalPosts: totalPosts[0]?.count || 0,
                    metrics: metrics.reduce((acc, metric) => {
                        acc[metric.metricType] = {
                            total: metric.totalValue,
                            count: metric.count,
                        };
                        return acc;
                    }, {}),
                },
                platformBreakdown,
            },
        });
    }
    catch (error) {
        console.error('Error fetching analytics overview:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch analytics overview',
        });
    }
});
// Get performance metrics with time series data
router.get('/performance', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate, platform, metricType = 'views' } = req.query;
        const conditions = [eq(posts.userId, userId)];
        if (startDate) {
            conditions.push(gte(analytics.recordedAt, new Date(startDate)));
        }
        if (endDate) {
            conditions.push(lte(analytics.recordedAt, new Date(endDate)));
        }
        if (platform) {
            conditions.push(eq(posts.platform, platform));
        }
        if (metricType) {
            conditions.push(eq(analytics.metricType, metricType));
        }
        // Get time series data grouped by date
        const timeSeriesQuery = db
            .select({
            date: sql `date(${analytics.recordedAt})`,
            platform: posts.platform,
            totalValue: sql `sum(${analytics.metricValue})`,
            count: sql `count(*)`,
        })
            .from(analytics)
            .innerJoin(posts, eq(analytics.postId, posts.id))
            .where(and(...conditions))
            .groupBy(sql `date(${analytics.recordedAt})`, posts.platform)
            .orderBy(sql `date(${analytics.recordedAt})`);
        const timeSeries = await timeSeriesQuery;
        // Get top performing posts
        const topPostsQuery = db
            .select({
            postId: posts.id,
            platform: posts.platform,
            contentType: posts.contentType,
            createdAt: posts.createdAt,
            totalValue: sql `sum(${analytics.metricValue})`,
        })
            .from(analytics)
            .innerJoin(posts, eq(analytics.postId, posts.id))
            .where(and(...conditions))
            .groupBy(posts.id, posts.platform, posts.contentType, posts.createdAt)
            .orderBy(desc(sql `sum(${analytics.metricValue})`))
            .limit(10);
        const topPosts = await topPostsQuery;
        res.json({
            success: true,
            data: {
                timeSeries,
                topPosts,
                metricType,
            },
        });
    }
    catch (error) {
        console.error('Error fetching performance metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch performance metrics',
        });
    }
});
// Get trend data for analytics
router.get('/trends', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { days = 30 } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days));
        // Get daily trends for the last N days
        const trendsQuery = db
            .select({
            date: sql `date(${analytics.recordedAt})`,
            metricType: analytics.metricType,
            totalValue: sql `sum(${analytics.metricValue})`,
        })
            .from(analytics)
            .innerJoin(posts, eq(analytics.postId, posts.id))
            .where(and(eq(posts.userId, userId), gte(analytics.recordedAt, daysAgo)))
            .groupBy(sql `date(${analytics.recordedAt})`, analytics.metricType)
            .orderBy(sql `date(${analytics.recordedAt})`);
        const trends = await trendsQuery;
        // Calculate growth rates
        const growthRates = {};
        const metricTypes = [...new Set(trends.map(t => t.metricType))];
        for (const metricType of metricTypes) {
            const metricTrends = trends.filter(t => t.metricType === metricType);
            if (metricTrends.length >= 2) {
                const latest = metricTrends[metricTrends.length - 1];
                const previous = metricTrends[metricTrends.length - 2];
                if (previous.totalValue > 0) {
                    growthRates[metricType] = ((latest.totalValue - previous.totalValue) / previous.totalValue) * 100;
                }
            }
        }
        res.json({
            success: true,
            data: {
                trends,
                growthRates,
                period: `${days} days`,
            },
        });
    }
    catch (error) {
        console.error('Error fetching trend data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch trend data',
        });
    }
});
// Create or update analytics metrics (for simulated data)
router.post('/metrics', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { postId, metrics } = req.body;
        // Verify the post belongs to the user
        const post = await db
            .select()
            .from(posts)
            .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
            .limit(1);
        if (!post.length) {
            return res.status(404).json({
                success: false,
                error: 'Post not found',
            });
        }
        // Insert analytics metrics
        const analyticsData = metrics.map((metric) => ({
            postId,
            metricType: metric.type,
            metricValue: metric.value,
        }));
        await db.insert(analytics).values(analyticsData);
        res.json({
            success: true,
            message: 'Analytics metrics recorded successfully',
        });
    }
    catch (error) {
        console.error('Error recording analytics metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to record analytics metrics',
        });
    }
});
export default router;
//# sourceMappingURL=analytics.js.map