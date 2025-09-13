import { useQuery } from '@tanstack/react-query';

export const ANALYTICS_QUERY_KEYS = {
  all: ['analytics'] as const,
  overview: (params?: any) => ['analytics', 'overview', params] as const,
  performance: (params?: any) => ['analytics', 'performance', params] as const,
  trends: (params?: any) => ['analytics', 'trends', params] as const,
} as const;

// Mock analytics API for now - will be replaced with real API calls
const mockAnalyticsApi = {
  async getOverview(params: any = {}) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      data: {
        totalPosts: 45,
        totalViews: 12500,
        totalLikes: 890,
        totalShares: 156,
        engagementRate: 8.4,
        topPlatform: 'instagram',
        growthRate: 12.3,
      },
    };
  },

  async getPerformance(params: any = {}) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 700));
    
    return {
      success: true,
      data: {
        posts: [
          {
            id: 1,
            platform: 'instagram',
            contentType: 'image',
            views: 1250,
            likes: 89,
            shares: 12,
            comments: 23,
            engagementRate: 9.9,
            createdAt: '2024-01-15T10:00:00Z',
          },
          {
            id: 2,
            platform: 'tiktok',
            contentType: 'video',
            views: 3400,
            likes: 234,
            shares: 45,
            comments: 67,
            engagementRate: 10.2,
            createdAt: '2024-01-14T15:30:00Z',
          },
        ],
        platformBreakdown: {
          instagram: { posts: 20, avgEngagement: 8.5 },
          tiktok: { posts: 15, avgEngagement: 9.2 },
          youtube: { posts: 8, avgEngagement: 7.8 },
          linkedin: { posts: 2, avgEngagement: 6.1 },
        },
      },
    };
  },

  async getTrends(params: any = {}) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const days = 30;
    const data = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      
      return {
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 500) + 200,
        likes: Math.floor(Math.random() * 50) + 10,
        shares: Math.floor(Math.random() * 15) + 2,
        comments: Math.floor(Math.random() * 25) + 5,
      };
    });
    
    return {
      success: true,
      data: {
        timeSeriesData: data,
        summary: {
          avgViews: data.reduce((sum, d) => sum + d.views, 0) / data.length,
          avgLikes: data.reduce((sum, d) => sum + d.likes, 0) / data.length,
          avgShares: data.reduce((sum, d) => sum + d.shares, 0) / data.length,
          avgComments: data.reduce((sum, d) => sum + d.comments, 0) / data.length,
        },
      },
    };
  },
};

interface AnalyticsParams {
  startDate?: string;
  endDate?: string;
  platform?: string;
  contentType?: string;
}

export function useAnalyticsOverview(params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.overview(params),
    queryFn: () => mockAnalyticsApi.getOverview(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useAnalyticsPerformance(params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.performance(params),
    queryFn: () => mockAnalyticsApi.getPerformance(params),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 8 * 60 * 1000, // 8 minutes
  });
}

export function useAnalyticsTrends(params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.trends(params),
    queryFn: () => mockAnalyticsApi.getTrends(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 6 * 60 * 1000, // 6 minutes
  });
}