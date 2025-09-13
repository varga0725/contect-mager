import { 
  pgTable, 
  serial, 
  varchar, 
  integer, 
  timestamp, 
  jsonb
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  subscriptionTier: varchar('subscription_tier', { length: 50 }).notNull().default('free'),
  monthlyUsage: integer('monthly_usage').notNull().default(0),
  usageResetDate: timestamp('usage_reset_date').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Posts table
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform: varchar('platform', { length: 50 }).notNull(),
  contentType: varchar('content_type', { length: 50 }).notNull(),
  contentData: jsonb('content_data').notNull(),
  metadata: jsonb('metadata'),
  scheduledAt: timestamp('scheduled_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Analytics table
export const analytics = pgTable('analytics', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  metricType: varchar('metric_type', { length: 50 }).notNull(),
  metricValue: integer('metric_value').notNull(),
  recordedAt: timestamp('recorded_at').notNull().defaultNow(),
});

// Subscriptions table
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull(),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Define relationships
export const usersRelations = relations(users, ({ many, one }) => ({
  posts: many(posts),
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  analytics: many(analytics),
}));

export const analyticsRelations = relations(analytics, ({ one }) => ({
  post: one(posts, {
    fields: [analytics.postId],
    references: [posts.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));