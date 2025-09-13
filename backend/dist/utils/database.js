import { db, DatabaseError } from '../config/database.js';
import { eq, and, desc, asc, count, sql } from 'drizzle-orm';
import { users, posts, analytics, subscriptions } from '../models/schema.js';
// User utilities
export class UserRepository {
    static async create(userData) {
        try {
            const [user] = await db.insert(users).values(userData).returning();
            return user;
        }
        catch (error) {
            throw new DatabaseError('Failed to create user', error);
        }
    }
    static async findById(id) {
        try {
            const [user] = await db.select().from(users).where(eq(users.id, id));
            return user || null;
        }
        catch (error) {
            throw new DatabaseError('Failed to find user by ID', error);
        }
    }
    static async findByEmail(email) {
        try {
            const [user] = await db.select().from(users).where(eq(users.email, email));
            return user || null;
        }
        catch (error) {
            throw new DatabaseError('Failed to find user by email', error);
        }
    }
    static async update(id, updates) {
        try {
            const [user] = await db
                .update(users)
                .set({ ...updates, updatedAt: new Date() })
                .where(eq(users.id, id))
                .returning();
            return user || null;
        }
        catch (error) {
            throw new DatabaseError('Failed to update user', error);
        }
    }
    static async delete(id) {
        try {
            const result = await db.delete(users).where(eq(users.id, id));
            return result.rowCount > 0;
        }
        catch (error) {
            throw new DatabaseError('Failed to delete user', error);
        }
    }
    static async incrementUsage(id) {
        try {
            const [user] = await db
                .update(users)
                .set({
                monthlyUsage: sql `${users.monthlyUsage} + 1`,
                updatedAt: new Date()
            })
                .where(eq(users.id, id))
                .returning();
            return user || null;
        }
        catch (error) {
            throw new DatabaseError('Failed to increment user usage', error);
        }
    }
    static async resetUsage(id) {
        try {
            const [user] = await db
                .update(users)
                .set({
                monthlyUsage: 0,
                usageResetDate: new Date(),
                updatedAt: new Date()
            })
                .where(eq(users.id, id))
                .returning();
            return user || null;
        }
        catch (error) {
            throw new DatabaseError('Failed to reset user usage', error);
        }
    }
}
// Post utilities
export class PostRepository {
    static async create(postData) {
        try {
            const [post] = await db.insert(posts).values(postData).returning();
            return post;
        }
        catch (error) {
            throw new DatabaseError('Failed to create post', error);
        }
    }
    static async findById(id) {
        try {
            const [post] = await db.select().from(posts).where(eq(posts.id, id));
            return post || null;
        }
        catch (error) {
            throw new DatabaseError('Failed to find post by ID', error);
        }
    }
    static async findByUserId(userId, limit = 20, offset = 0) {
        try {
            return await db
                .select()
                .from(posts)
                .where(eq(posts.userId, userId))
                .orderBy(desc(posts.createdAt))
                .limit(limit)
                .offset(offset);
        }
        catch (error) {
            throw new DatabaseError('Failed to find posts by user ID', error);
        }
    }
    static async findByPlatform(userId, platform, limit = 20, offset = 0) {
        try {
            return await db
                .select()
                .from(posts)
                .where(and(eq(posts.userId, userId), eq(posts.platform, platform)))
                .orderBy(desc(posts.createdAt))
                .limit(limit)
                .offset(offset);
        }
        catch (error) {
            throw new DatabaseError('Failed to find posts by platform', error);
        }
    }
    static async update(id, updates) {
        try {
            const [post] = await db
                .update(posts)
                .set(updates)
                .where(eq(posts.id, id))
                .returning();
            return post || null;
        }
        catch (error) {
            throw new DatabaseError('Failed to update post', error);
        }
    }
    static async delete(id) {
        try {
            const result = await db.delete(posts).where(eq(posts.id, id));
            return result.rowCount > 0;
        }
        catch (error) {
            throw new DatabaseError('Failed to delete post', error);
        }
    }
    static async getScheduledPosts(userId) {
        try {
            return await db
                .select()
                .from(posts)
                .where(and(eq(posts.userId, userId), sql `${posts.scheduledAt} IS NOT NULL`))
                .orderBy(asc(posts.scheduledAt));
        }
        catch (error) {
            throw new DatabaseError('Failed to get scheduled posts', error);
        }
    }
    static async countByUser(userId) {
        try {
            const [result] = await db
                .select({ count: count() })
                .from(posts)
                .where(eq(posts.userId, userId));
            return result.count;
        }
        catch (error) {
            throw new DatabaseError('Failed to count posts by user', error);
        }
    }
}
// Analytics utilities
export class AnalyticsRepository {
    static async create(analyticsData) {
        try {
            const [analytics] = await db.insert(analytics).values(analyticsData).returning();
            return analytics;
        }
        catch (error) {
            throw new DatabaseError('Failed to create analytics record', error);
        }
    }
    static async findByPostId(postId) {
        try {
            return await db
                .select()
                .from(analytics)
                .where(eq(analytics.postId, postId))
                .orderBy(desc(analytics.recordedAt));
        }
        catch (error) {
            throw new DatabaseError('Failed to find analytics by post ID', error);
        }
    }
    static async getMetricsByUser(userId, metricType, startDate, endDate) {
        try {
            let query = db
                .select({
                id: analytics.id,
                postId: analytics.postId,
                metricType: analytics.metricType,
                metricValue: analytics.metricValue,
                recordedAt: analytics.recordedAt,
            })
                .from(analytics)
                .innerJoin(posts, eq(analytics.postId, posts.id))
                .where(eq(posts.userId, userId));
            // Add optional filters
            const conditions = [eq(posts.userId, userId)];
            if (metricType) {
                conditions.push(eq(analytics.metricType, metricType));
            }
            if (startDate) {
                conditions.push(sql `${analytics.recordedAt} >= ${startDate}`);
            }
            if (endDate) {
                conditions.push(sql `${analytics.recordedAt} <= ${endDate}`);
            }
            if (conditions.length > 1) {
                query = query.where(and(...conditions));
            }
            return await query.orderBy(desc(analytics.recordedAt));
        }
        catch (error) {
            throw new DatabaseError('Failed to get metrics by user', error);
        }
    }
}
// Subscription utilities
export class SubscriptionRepository {
    static async create(subscriptionData) {
        try {
            const [subscription] = await db.insert(subscriptions).values(subscriptionData).returning();
            return subscription;
        }
        catch (error) {
            throw new DatabaseError('Failed to create subscription', error);
        }
    }
    static async findByUserId(userId) {
        try {
            const [subscription] = await db
                .select()
                .from(subscriptions)
                .where(eq(subscriptions.userId, userId));
            return subscription || null;
        }
        catch (error) {
            throw new DatabaseError('Failed to find subscription by user ID', error);
        }
    }
    static async update(id, updates) {
        try {
            const [subscription] = await db
                .update(subscriptions)
                .set(updates)
                .where(eq(subscriptions.id, id))
                .returning();
            return subscription || null;
        }
        catch (error) {
            throw new DatabaseError('Failed to update subscription', error);
        }
    }
    static async delete(id) {
        try {
            const result = await db.delete(subscriptions).where(eq(subscriptions.id, id));
            return result.rowCount > 0;
        }
        catch (error) {
            throw new DatabaseError('Failed to delete subscription', error);
        }
    }
}
// Transaction utilities
export async function withTransaction(callback) {
    try {
        return await db.transaction(callback);
    }
    catch (error) {
        throw new DatabaseError('Transaction failed', error);
    }
}
//# sourceMappingURL=database.js.map