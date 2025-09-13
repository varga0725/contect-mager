import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface TrendData {
  date: string;
  metricType: string;
  totalValue: number;
}

interface TrendsData {
  trends: TrendData[];
  growthRates: Record<string, number>;
  period: string;
}

export const TrendsView: React.FC = () => {
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/analytics/trends?days=${selectedPeriod}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trends data');
      }

      const result = await response.json();
      if (result.success) {
        setTrendsData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch trends');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, [selectedPeriod]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatGrowthRate = (rate: number): string => {
    const sign = rate >= 0 ? '+' : '';
    return `${sign}${rate.toFixed(1)}%`;
  };

  const getGrowthColor = (rate: number): string => {
    if (rate > 0) return 'text-green-600';
    if (rate < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (rate: number): string => {
    if (rate > 0) return '↗️';
    if (rate < 0) return '↘️';
    return '➡️';
  };

  // Group trends by metric type for visualization
  const groupedTrends = trendsData?.trends.reduce((acc, trend) => {
    if (!acc[trend.metricType]) {
      acc[trend.metricType] = [];
    }
    acc[trend.metricType].push(trend);
    return acc;
  }, {} as Record<string, TrendData[]>) || {};

  // Calculate totals for each metric
  const metricTotals = Object.entries(groupedTrends).map(([metricType, trends]) => ({
    metricType,
    total: trends.reduce((sum, trend) => sum + trend.totalValue, 0),
    dataPoints: trends.length,
  }));

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
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
            <Button onClick={fetchTrends}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Trends Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            {[7, 14, 30, 90].map((days) => (
              <Button
                key={days}
                variant={selectedPeriod === days ? 'default' : 'outline'}
                onClick={() => setSelectedPeriod(days)}
              >
                {days} days
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Growth Rates */}
      <Card>
        <CardHeader>
          <CardTitle>Growth Rates ({trendsData?.period})</CardTitle>
        </CardHeader>
        <CardContent>
          {!trendsData?.growthRates || Object.keys(trendsData.growthRates).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No growth data available for the selected period
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(trendsData.growthRates).map(([metricType, rate]) => (
                <div key={metricType} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium capitalize">{metricType}</span>
                    <span className="text-lg">{getGrowthIcon(rate)}</span>
                  </div>
                  <div className={`text-2xl font-bold ${getGrowthColor(rate)}`}>
                    {formatGrowthRate(rate)}
                  </div>
                  <div className="text-sm text-gray-600">
                    vs. previous period
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metric Totals */}
      <Card>
        <CardHeader>
          <CardTitle>Total Metrics ({trendsData?.period})</CardTitle>
        </CardHeader>
        <CardContent>
          {metricTotals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No metrics data available
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {metricTotals.map((metric) => (
                <div key={metric.metricType} className="p-4 border rounded-lg">
                  <div className="text-sm font-medium text-gray-600 capitalize mb-1">
                    {metric.metricType}
                  </div>
                  <div className="text-2xl font-bold mb-1">
                    {formatNumber(metric.total)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {metric.dataPoints} data points
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Trends Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(groupedTrends).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No daily trends data available
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTrends).map(([metricType, trends]) => {
                const maxValue = Math.max(...trends.map(t => t.totalValue));
                return (
                  <div key={metricType} className="space-y-2">
                    <h4 className="font-medium capitalize">{metricType}</h4>
                    <div className="flex items-end space-x-1 h-32">
                      {trends.map((trend, index) => {
                        const barHeight = maxValue > 0 ? (trend.totalValue / maxValue) * 100 : 0;
                        return (
                          <div key={index} className="flex flex-col items-center flex-1 min-w-0">
                            <div className="text-xs text-gray-600 mb-1">
                              {trend.totalValue}
                            </div>
                            <div
                              className="w-full bg-blue-500 rounded-t"
                              style={{
                                height: `${barHeight}%`,
                                minHeight: trend.totalValue > 0 ? '4px' : '0px',
                              }}
                            />
                            <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">
                              {new Date(trend.date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trendsData?.growthRates && Object.keys(trendsData.growthRates).length > 0 ? (
              <>
                {Object.entries(trendsData.growthRates).map(([metricType, rate]) => (
                  <div key={metricType} className="flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                    <div>
                      <p className="text-sm">
                        <span className="font-medium capitalize">{metricType}</span> 
                        {rate > 0 ? ' increased' : rate < 0 ? ' decreased' : ' remained stable'} by{' '}
                        <span className={`font-semibold ${getGrowthColor(rate)}`}>
                          {Math.abs(rate).toFixed(1)}%
                        </span>{' '}
                        compared to the previous {trendsData.period.replace(' days', '-day')} period.
                      </p>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>Generate more content to see trend insights!</p>
                <p className="text-sm mt-1">
                  Insights will appear once you have content data across multiple time periods.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};