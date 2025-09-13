// User types
export interface User {
  id: number;
  email: string;
  subscriptionTier: 'free' | 'pro' | 'creator';
  monthlyUsage: number;
  usageResetDate: Date;
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

// Platform types
export type Platform = 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'twitter';

// Content types
export interface GeneratedContent {
  id: number;
  userId: number;
  platform: Platform;
  contentType: 'caption' | 'image' | 'video';
  contentData: {
    text?: string;
    imageUrl?: string;
    videoUrl?: string;
    hashtags?: string[];
  };
  metadata: Record<string, any>;
  scheduledAt?: Date;
  createdAt: Date;
}

// Analytics types
export interface AnalyticsMetric {
  id: number;
  postId: number;
  metricType: string;
  metricValue: number;
  recordedAt: Date;
}

export interface AnalyticsOverview {
  totalPosts: number;
  metrics: Record<string, { total: number; count: number }>;
}

export interface PlatformBreakdown {
  platform: string;
  count: number;
  totalViews: number;
  totalLikes: number;
}

export interface TimeSeriesData {
  date: string;
  platform: string;
  totalValue: number;
  count: number;
}

export interface TopPost {
  postId: number;
  platform: string;
  contentType: string;
  createdAt: string;
  totalValue: number;
}

export interface TrendData {
  date: string;
  metricType: string;
  totalValue: number;
}

export interface AnalyticsResponse {
  success: boolean;
  data: {
    overview: AnalyticsOverview;
    platformBreakdown: PlatformBreakdown[];
  };
}

export interface PerformanceResponse {
  success: boolean;
  data: {
    timeSeries: TimeSeriesData[];
    topPosts: TopPost[];
    metricType: string;
  };
}

export interface TrendsResponse {
  success: boolean;
  data: {
    trends: TrendData[];
    growthRates: Record<string, number>;
    period: string;
  };
}

// Content Library types
export interface ContentLibraryFilters {
  platform?: Platform | null;
  contentType?: 'caption' | 'image' | 'video' | null;
  sortBy?: 'createdAt' | 'platform' | 'contentType';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ContentLibraryResponse {
  success: boolean;
  data: {
    content: GeneratedContent[];
    pagination: PaginationInfo;
    filters: ContentLibraryFilters & {
      sortBy: string;
      sortOrder: string;
    };
  };
}

// Scheduling types
export interface ScheduleRequest {
  postId: number;
  scheduledAt: string;
}

export interface ScheduleUpdateRequest {
  scheduledAt: string | null;
}

export interface ScheduledContent extends GeneratedContent {
  scheduledAt: Date;
}

export interface CalendarEvent {
  id: number;
  title: string;
  date: Date;
  content: GeneratedContent;
  platform: Platform;
}

export interface CalendarFilters {
  startDate?: Date;
  endDate?: Date;
  platform?: Platform | null;
}

export interface ScheduleResponse {
  success: boolean;
  data: GeneratedContent[];
}

// Subscription types
export type SubscriptionTier = 'free' | 'pro' | 'creator';

export interface Subscription {
  id: number;
  userId: number;
  stripeSubscriptionId: string | null;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
}

export interface UsageStats {
  currentUsage: number;
  monthlyLimit: number;
  tier: SubscriptionTier;
  resetDate: Date;
  remainingPosts: number;
}

export interface SubscriptionStatus {
  subscription?: Subscription;
  usage: UsageStats;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

export interface SubscriptionStatusResponse {
  success: boolean;
  data: SubscriptionStatus;
}

export interface UsageStatsResponse {
  success: boolean;
  data: UsageStats;
}

export interface CheckoutSessionResponse {
  success: boolean;
  data: CheckoutSession;
}

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price: number;
  monthlyPosts: number;
  features: string[];
  popular?: boolean;
}