import { db } from '../config/database.js';
import { analytics } from '../models/schema.js';
import { eq, sql } from 'drizzle-orm';

export class AnalyticsService {
  /**
   * Initialize analytics for a newly created post with simulated baseline metrics
   */
  static async initializePostAnalytics(postId: number): Promise<void> {
    try {
      // Generate realistic baseline metrics for a new post
      const baselineMetrics = [
        { type: 'views', value: Math.floor(Math.random() * 50) + 10 }, // 10-60 initial views
        { type: 'likes', value: Math.floor(Math.random() * 10) + 1 }, // 1-11 initial likes
        { type: 'shares', value: Math.floor(Math.random() * 3) }, // 0-3 initial shares
        { type: 'comments', value: Math.floor(Math.random() * 5) }, // 0-5 initial comments
      ];

      const analyticsData = baselineMetrics.map(metric => ({
        postId,
        metricType: metric.type,
        metricValue: metric.value,
      }));

      await db.insert(analytics).values(analyticsData);
    } catch (error) {
      console.error('Error initializing post analytics:', error);
      // Don't throw error to avoid breaking content creation
    }
  }

  /**
   * Simulate organic growth of metrics over time
   */
  static async simulateMetricGrowth(postId: number): Promise<void> {
    try {
      // Get current metrics for the post
      const currentMetrics = await db
        .select()
        .from(analytics)
        .where(eq(analytics.postId, postId));

      if (currentMetrics.length === 0) {
        return;
      }

      // Simulate growth with some randomness
      const growthMetrics = currentMetrics.map(metric => {
        let growthValue = 0;
        
        switch (metric.metricType) {
          case 'views':
            growthValue = Math.floor(Math.random() * 20) + 5; // 5-25 additional views
            break;
          case 'likes':
            growthValue = Math.floor(Math.random() * 5) + 1; // 1-6 additional likes
            break;
          case 'shares':
            growthValue = Math.floor(Math.random() * 2); // 0-2 additional shares
            break;
          case 'comments':
            growthValue = Math.floor(Math.random() * 3); // 0-3 additional comments
            break;
        }

        return {
          postId,
          metricType: metric.metricType,
          metricValue: growthValue,
        };
      }).filter(metric => metric.metricValue > 0);

      if (growthMetrics.length > 0) {
        await db.insert(analytics).values(growthMetrics);
      }
    } catch (error) {
      console.error('Error simulating metric growth:', error);
    }
  }

  /**
   * Get aggregated metrics for a post
   */
  static async getPostMetrics(postId: number): Promise<Record<string, number>> {
    try {
      const metrics = await db
        .select({
          metricType: analytics.metricType,
          totalValue: sql<number>`sum(${analytics.metricValue})`,
        })
        .from(analytics)
        .where(eq(analytics.postId, postId))
        .groupBy(analytics.metricType);

      return metrics.reduce((acc, metric) => {
        acc[metric.metricType] = metric.totalValue;
        return acc;
      }, {} as Record<string, number>);
    } catch (error) {
      console.error('Error getting post metrics:', error);
      return {};
    }
  }

  /**
   * Record custom analytics event
   */
  static async recordMetric(
    postId: number, 
    metricType: string, 
    metricValue: number
  ): Promise<void> {
    try {
      await db.insert(analytics).values({
        postId,
        metricType,
        metricValue,
      });
    } catch (error) {
      console.error('Error recording metric:', error);
      throw error;
    }
  }
}