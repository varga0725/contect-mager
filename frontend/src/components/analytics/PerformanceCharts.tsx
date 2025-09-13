import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Platform } from '../../types';

interface TimeSeriesData {
  date: string;
  platform: string;
  totalValue: number;
  count: number;
}

interface TopPost {
  postId: number;
  platform: string;
  contentType: string;
  createdAt: string;
  totalValue: number;
}

interface PerformanceData {
  timeSeries: TimeSeriesData[];
  topPosts: TopPost[];
  metricType: string;
}

interface ChartFilters {
  startDate?: string;
  endDate?: string;
  platform?: Platform | '';
  metricType: string;
}

export const PerformanceCharts: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ChartFilters>({
    startDate: '',
    endDate: '',
    platform: '',
    metricType: 'views',
  });

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.platform) params.append('platform', filters.platform);
      params.append('metricType', filters.metricType);

      const response = await fetch(`/api/analytics/performance?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }

      const result = await response.json();
      if (result.success) {
        setPerformanceData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch performance data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const handleFilterChange = (key: keyof ChartFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchPerformanceData();
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPlatformColor = (platform: string): string => {
    const colors: Record<string, string> = {
      instagram: '#E4405F',
      tiktok: '#000000',
      youtube: '#FF0000',
      linkedin: '#0077B5',
      twitter: '#1DA1F2',
    };
    return colors[platform] || '#6B7280';
  };

  // Simple bar chart implementation
  const renderTimeSeriesChart = () => {
    if (!performanceData?.timeSeries.length) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No time series data available
        </div>
      );
    }

    const maxValue = Math.max(...performanceData.timeSeries.map(d => d.totalValue));
    const chartHeight = 200;

    return (
      <div className="space-y-4">
        <div className="flex items-end space-x-2 h-64 px-4">
          {performanceData.timeSeries.map((data, index) => {
            const barHeight = maxValue > 0 ? (data.totalValue / maxValue) * chartHeight : 0;
            return (
              <div key={index} className="flex flex-col items-center flex-1 min-w-0">
                <div className="text-xs text-gray-600 mb-1">
                  {formatNumber(data.totalValue)}
                </div>
                <div
                  className="w-full rounded-t"
                  style={{
                    height: `${barHeight}px`,
                    backgroundColor: getPlatformColor(data.platform),
                    minHeight: data.totalValue > 0 ? '4px' : '0px',
                  }}
                />
                <div className="text-xs text-gray-500 mt-1 text-center">
                  {formatDate(data.date)}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center">
          {[...new Set(performanceData.timeSeries.map(d => d.platform))].map(platform => (
            <div key={platform} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: getPlatformColor(platform) }}
              />
              <span className="text-sm capitalize">{platform}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchPerformanceData}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Platform</label>
              <select
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
            <div>
              <label className="block text-sm font-medium mb-1">Metric</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.metricType}
                onChange={(e) => handleFilterChange('metricType', e.target.value)}
              >
                <option value="views">Views</option>
                <option value="likes">Likes</option>
                <option value="shares">Shares</option>
                <option value="comments">Comments</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={applyFilters} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Series Chart */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filters.metricType.charAt(0).toUpperCase() + filters.metricType.slice(1)} Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderTimeSeriesChart()}
        </CardContent>
      </Card>

      {/* Top Performing Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {!performanceData?.topPosts.length ? (
            <div className="text-center py-8 text-gray-500">
              No top posts data available
            </div>
          ) : (
            <div className="space-y-4">
              {performanceData.topPosts.map((post, index) => (
                <div key={post.postId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: getPlatformColor(post.platform) }}
                        />
                        <span className="font-medium capitalize">{post.platform}</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500 capitalize">{post.contentType}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Created {formatDate(post.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {formatNumber(post.totalValue)} {filters.metricType}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};