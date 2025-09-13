// Centralized query keys for better organization and type safety
export const queryKeys = {
  // Authentication
  auth: {
    all: ['auth'] as const,
    currentUser: () => [...queryKeys.auth.all, 'currentUser'] as const,
  },

  // Content
  content: {
    all: ['content'] as const,
    library: (params?: any) => [...queryKeys.content.all, 'library', params] as const,
    usage: () => [...queryKeys.content.all, 'usage'] as const,
    item: (id: number) => [...queryKeys.content.all, 'item', id] as const,
  },

  // Scheduling
  schedule: {
    all: ['schedule'] as const,
    content: (params?: any) => [...queryKeys.schedule.all, 'content', params] as const,
    calendar: (month: string) => [...queryKeys.schedule.all, 'calendar', month] as const,
  },

  // Analytics
  analytics: {
    all: ['analytics'] as const,
    overview: (params?: any) => [...queryKeys.analytics.all, 'overview', params] as const,
    performance: (params?: any) => [...queryKeys.analytics.all, 'performance', params] as const,
    trends: (params?: any) => [...queryKeys.analytics.all, 'trends', params] as const,
  },

  // Subscription
  subscription: {
    all: ['subscription'] as const,
    status: () => [...queryKeys.subscription.all, 'status'] as const,
    usage: () => [...queryKeys.subscription.all, 'usage'] as const,
    billing: () => [...queryKeys.subscription.all, 'billing'] as const,
  },
} as const;

// Helper function to invalidate related queries
export const invalidationPatterns = {
  // When user logs out, clear everything
  onLogout: [
    queryKeys.content.all,
    queryKeys.schedule.all,
    queryKeys.analytics.all,
    queryKeys.subscription.all,
  ],

  // When content is created/deleted, invalidate content and usage
  onContentChange: [
    queryKeys.content.all,
    queryKeys.content.usage(),
    queryKeys.analytics.all,
  ],

  // When content is scheduled, invalidate schedule and content
  onScheduleChange: [
    queryKeys.schedule.all,
    queryKeys.content.all,
  ],

  // When subscription changes, invalidate subscription and usage
  onSubscriptionChange: [
    queryKeys.subscription.all,
    queryKeys.content.usage(),
  ],
} as const;