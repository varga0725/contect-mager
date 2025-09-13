import { db, DatabaseError } from '../config/database.js';
import { eq, and, desc, asc, count, sql } from 'drizzle-orm';
import { users, posts, analytics, subscriptions } from '../models/schema.js';
import type { 
  User, 
  NewUser, 
  UserUpdate, 
  Post, 
  NewPost, 
  PostUpdate,
  Analytics,
  NewAnalytics,
  Subscription,
  NewSubscription,
  SubscriptionUpdate
} from '../types/database.js';

// User utilities
export class UserRepository {
  static async create(userData: NewUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(userData).returning();
      return user;
    } catch (error) {
      throw new DatabaseError('Failed to create user', error as Error);
    }
  }

  static async findById(id: number): Promise<User | null> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user || null;
    } catch (error) {
      throw new DatabaseError('Failed to find user by ID', error as Error);
    }
  }

  static async findByEmail(email: string): Promise<User | null> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user || null;
    } catch (error) {
      throw new DatabaseError('Failed to find user by email', error as Error);
    }
  }

  static async update(id: number, updates: UserUpdate): Promise<User | null> {
    try {
      const [user] = await db
        .update(users)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      return user || null;
    } catch (error) {
      throw new DatabaseError('Failed to update user', error as Error);
    }
  }

  static async delete(id: number): Promise<boolean> {
    try {
      const result = await db.delete(users).where(eq(users.id, id));
      return result.rowCount > 0;
    } catch (error) {
      throw new DatabaseError('Failed to delete user', error as Error);
    }
  }

  static async incrementUsage(id: number): Promise<User | null> {
    try {
      const [user] = await db
        .update(users)
        .set({ 
          monthlyUsage: sql`${users.monthlyUsage} + 1`,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();
      return user || null;
    } catch (error) {
      throw new DatabaseError('Failed to increment user usage', error as Error);
    }
  }

  static async resetUsage(id: number): Promise<User | null> {
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
    } catch (error) {
      throw new DatabaseError('Failed to reset user usage', error as Error);
    }
  }
}

// Post utilities
export class PostRepository {
  static async create(postData: NewPost): Promise<Post> {
    try {
      const [post] = await db.insert(posts).values(postData).returning();
      return post;
    } catch (error) {
      throw new DatabaseError('Failed to create post', error as Error);
    }
  }

  static async findById(id: number): Promise<Post | null> {
    try {
      const [post] = await db.select().from(posts).where(eq(posts.id, id));
      return post || null;
    } catch (error) {
      throw new DatabaseError('Failed to find post by ID', error as Error);
    }
  }

  static async findByUserId(
    userId: number, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<Post[]> {
    try {
      return await db
        .select()
        .from(posts)
        .where(eq(posts.userId, userId))
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      throw new DatabaseError('Failed to find posts by user ID', error as Error);
    }
  }

  static async findByPlatform(
    userId: number, 
    platform: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Post[]> {
    try {
      return await db
        .select()
        .from(posts)
        .where(and(eq(posts.userId, userId), eq(posts.platform, platform)))
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      throw new DatabaseError('Failed to find posts by platform', error as Error);
    }
  }

  static async update(id: number, updates: PostUpdate): Promise<Post | null> {
    try {
      const [post] = await db
        .update(posts)
        .set(updates)
        .where(eq(posts.id, id))
        .returning();
      return post || null;
    } catch (error) {
      throw new DatabaseError('Failed to update post', error as Error);
    }
  }

  static async delete(id: number): Promise<boolean> {
    try {
      const result = await db.delete(posts).where(eq(posts.id, id));
      return result.rowCount > 0;
    } catch (error) {
      throw new DatabaseError('Failed to delete post', error as Error);
    }
  }

  static async getScheduledPosts(userId: number): Promise<Post[]> {
    try {
      return await db
        .select()
        .from(posts)
        .where(and(
          eq(posts.userId, userId),
          sql`${posts.scheduledAt} IS NOT NULL`
        ))
        .orderBy(asc(posts.scheduledAt));
    } catch (error) {
      throw new DatabaseError('Failed to get scheduled posts', error as Error);
    }
  }

  static async countByUser(userId: number): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(posts)
        .where(eq(posts.userId, userId));
      return result.count;
    } catch (error) {
      throw new DatabaseError('Failed to count posts by user', error as Error);
    }
  }
}

// Analytics utilities
export class AnalyticsRepository {
  static async create(analyticsData: NewAnalytics): Promise<Analytics> {
    try {
      const [analytics] = await db.insert(analytics).values(analyticsData).returning();
      return analytics;
    } catch (error) {
      throw new DatabaseError('Failed to create analytics record', error as Error);
    }
  }

  static async findByPostId(postId: number): Promise<Analytics[]> {
    try {
      return await db
        .select()
        .from(analytics)
        .where(eq(analytics.postId, postId))
        .orderBy(desc(analytics.recordedAt));
    } catch (error) {
      throw new DatabaseError('Failed to find analytics by post ID', error as Error);
    }
  }

  static async getMetricsByUser(
    userId: number,
    metricType?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Analytics[]> {
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
        conditions.push(sql`${analytics.recordedAt} >= ${startDate}`);
      }
      
      if (endDate) {
        conditions.push(sql`${analytics.recordedAt} <= ${endDate}`);
      }

      if (conditions.length > 1) {
        query = query.where(and(...conditions));
      }

      return await query.orderBy(desc(analytics.recordedAt));
    } catch (error) {
      throw new DatabaseError('Failed to get metrics by user', error as Error);
    }
  }
}

// Subscription utilities
export class SubscriptionRepository {
  static async create(subscriptionData: NewSubscription): Promise<Subscription> {
    try {
      const [subscription] = await db.insert(subscriptions).values(subscriptionData).returning();
      return subscription;
    } catch (error) {
      throw new DatabaseError('Failed to create subscription', error as Error);
    }
  }

  static async findByUserId(userId: number): Promise<Subscription | null> {
    try {
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId));
      return subscription || null;
    } catch (error) {
      throw new DatabaseError('Failed to find subscription by user ID', error as Error);
    }
  }

  static async update(id: number, updates: SubscriptionUpdate): Promise<Subscription | null> {
    try {
      const [subscription] = await db
        .update(subscriptions)
        .set(updates)
        .where(eq(subscriptions.id, id))
        .returning();
      return subscription || null;
    } catch (error) {
      throw new DatabaseError('Failed to update subscription', error as Error);
    }
  }

  static async delete(id: number): Promise<boolean> {
    try {
      const result = await db.delete(subscriptions).where(eq(subscriptions.id, id));
      return result.rowCount > 0;
    } catch (error) {
      throw new DatabaseError('Failed to delete subscription', error as Error);
    }
  }
}

// Transaction utilities
export async function withTransaction<T>(
  callback: (tx: typeof db) => Promise<T>
): Promise<T> {
  try {
    return await db.transaction(callback);
  } catch (error) {
    throw new DatabaseError('Transaction failed', error as Error);
  }
}