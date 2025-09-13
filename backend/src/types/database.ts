import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users, posts, analytics, subscriptions } from '../models/schema.js';

// User types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type UserUpdate = Partial<Omit<NewUser, 'id' | 'createdAt'>>;

// Post types
export type Post = InferSelectModel<typeof posts>;
export type NewPost = InferInsertModel<typeof posts>;
export type PostUpdate = Partial<Omit<NewPost, 'id' | 'createdAt'>>;

// Analytics types
export type Analytics = InferSelectModel<typeof analytics>;
export type NewAnalytics = InferInsertModel<typeof analytics>;

// Subscription types
export type Subscription = InferSelectModel<typeof subscriptions>;
export type NewSubscription = InferInsertModel<typeof subscriptions>;
export type SubscriptionUpdate = Partial<Omit<NewSubscription, 'id' | 'createdAt'>>;

// Platform and content type enums
export type Platform = 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'twitter';
export type ContentType = 'caption' | 'image' | 'video';
export type SubscriptionTier = 'free' | 'pro' | 'creator';

// Content data interfaces
export interface ContentData {
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  hashtags?: string[];
  description?: string;
}

// Post metadata interface
export interface PostMetadata {
  platformSpecific?: Record<string, any>;
  generationParams?: Record<string, any>;
  optimizations?: Record<string, any>;
}

// Analytics metric types
export type MetricType = 'views' | 'likes' | 'shares' | 'comments' | 'saves' | 'clicks';

// Database query result types
export interface PostWithAnalytics extends Post {
  analytics: Analytics[];
}

export interface UserWithSubscription extends User {
  subscription?: Subscription;
}

export interface PostWithUser extends Post {
  user: User;
}