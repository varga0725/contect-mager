import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { Platform } from '../../types';

interface AnalyticsOverview {
  totalPosts: number;
  metrics: Record<string, { total: number; count: number }>;
}

interface PlatformBreakdown {
  platform: string;
  count: number;
  totalViews: number;
  totalLikes: number;
}

interface AnalyticsData {
  overview: AnalyticsOverview;
  platformBreakdown: PlatformBreakdown[];
}

interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  platform?: Platform | '';
}

export const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    startDate: '',
    endDate: '',
    platform: '',
  });

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.platform) params.append('platform', filters.platform);

      const response = await fetch(`/api/analytics/overview?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const result = await response.json();
      if (result.success) {
        setAnalyticsData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleFilterChange = (key: keyof AnalyticsFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchAnalytics();
  };

  const resetFilters = () => {
    setFilters({ startDate: '', endDate: '', platform: '' });
    setTimeout(fetchAnalytics, 0);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getEngagementRate = (likes: number, views: number): string => {
    if (views === 0) return '0%';
    return ((likes / views) * 100).toFixed(1) + '%';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchAnalytics}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">No analytics data available</p>
              <Button onClick={fetchAnalytics}>Refresh</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl sm:text-2xl font-bold">Analytics Dashboard</h2>
        <Button onClick={fetchAnalytics} variant="outline" className="w-full sm:w-auto">
          Refresh Data
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">Filters</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="platform">Platform</Label>
              <select
                id="platform"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.platform}
                onChange={(e) => handleFilterChange('platform', e.target.value)}
              >
                <option value="">All Platforms</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="linkedin">LinkedIn</option>
                <option value="twitter">Twitter</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-2">
              <Button onClick={applyFilters} className="w-full sm:w-auto">Apply Filters</Button>
              <Button onClick={resetFilters} variant="outline" className="w-full sm:w-auto">Reset</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total Posts</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-lg sm:text-2xl font-bold">{analyticsData.overview.totalPosts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total Views</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-lg sm:text-2xl font-bold">
              {formatNumber(analyticsData.overview.metrics.views?.total || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total Likes</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-lg sm:text-2xl font-bold">
              {formatNumber(analyticsData.overview.metrics.likes?.total || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Engagement Rate</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-lg sm:text-2xl font-bold">
              {getEngagementRate(
                analyticsData.overview.metrics.likes?.total || 0,
                analyticsData.overview.metrics.views?.total || 0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.platformBreakdown.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No platform data available</p>
            ) : (
              analyticsData.platformBreakdown.map((platform) => (
                <div key={platform.platform} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base">
                      {platform.platform.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold capitalize text-sm sm:text-base">{platform.platform}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">{platform.count} posts</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-base sm:text-lg font-semibold">{formatNumber(platform.totalViews)} views</div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      {formatNumber(platform.totalLikes)} likes • {getEngagementRate(platform.totalLikes, platform.totalViews)} engagement
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Engagement Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analyticsData.overview.metrics).map(([metricType, data]) => (
                <div key={metricType} className="flex justify-between items-center">
                  <span className="capitalize font-medium">{metricType}</span>
                  <div className="text-right">
                    <div className="font-semibold">{formatNumber(data.total)}</div>
                    <div className="text-sm text-gray-600">{data.count} posts</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Avg. Views per Post</span>
                <span className="font-semibold">
                  {analyticsData.overview.totalPosts > 0
                    ? formatNumber(Math.round((analyticsData.overview.metrics.views?.total || 0) / analyticsData.overview.totalPosts))
                    : '0'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Avg. Likes per Post</span>
                <span className="font-semibold">
                  {analyticsData.overview.totalPosts > 0
                    ? formatNumber(Math.round((analyticsData.overview.metrics.likes?.total || 0) / analyticsData.overview.totalPosts))
                    : '0'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Shares</span>
                <span className="font-semibold">
                  {formatNumber(analyticsData.overview.metrics.shares?.total || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Comments</span>
                <span className="font-semibold">
                  {formatNumber(analyticsData.overview.metrics.comments?.total || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};