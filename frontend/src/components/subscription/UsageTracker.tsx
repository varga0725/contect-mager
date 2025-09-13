import React from 'react';
import { Card } from '../ui/card';
import { LoadingSpinner } from '../ui/loading-spinner';
import { ErrorMessage } from '../ui/error-message';
import { useSubscriptionUsage } from '../../hooks/useSubscription';

export function UsageTracker() {
  const { data, isLoading, error } = useSubscriptionUsage();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="md" />
          <span className="ml-2">Loading usage data...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <ErrorMessage 
          error="Failed to load usage data"
        />
      </Card>
    );
  }

  if (!data?.success || !data.data) {
    return (
      <Card className="p-6">
        <ErrorMessage message="No usage data available" />
      </Card>
    );
  }

  const usage = data.data;
  const usagePercentage = (usage.currentUsage / usage.monthlyLimit) * 100;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = usage.remainingPosts === 0;

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysUntilReset = () => {
    const resetDate = new Date(usage.resetDate);
    const today = new Date();
    const diffTime = resetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const daysUntilReset = getDaysUntilReset();

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Usage Overview</h3>
        <span className="text-sm text-gray-500 capitalize">
          {usage.tier} Plan
        </span>
      </div>

      <div className="space-y-6">
        {/* Usage Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Posts Generated</span>
            <span className="text-sm text-gray-600">
              {usage.currentUsage} / {usage.monthlyLimit}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${
                isAtLimit 
                  ? 'bg-red-500' 
                  : isNearLimit 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {usage.remainingPosts} posts remaining
            </span>
            <span className="text-xs text-gray-500">
              {usagePercentage.toFixed(1)}% used
            </span>
          </div>
        </div>

        {/* Usage Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">
              {usage.currentUsage}
            </div>
            <div className="text-sm text-gray-600">Posts Used</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">
              {usage.remainingPosts}
            </div>
            <div className="text-sm text-gray-600">Posts Left</div>
          </div>
        </div>

        {/* Reset Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">
                Usage resets in {daysUntilReset} {daysUntilReset === 1 ? 'day' : 'days'}
              </p>
              <p className="text-xs text-blue-700">
                Next reset: {formatDate(usage.resetDate)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-900">
                {usage.monthlyLimit}
              </div>
              <div className="text-xs text-blue-700">posts/month</div>
            </div>
          </div>
        </div>

        {/* Usage Warnings */}
        {isAtLimit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-red-900">
              You've reached your monthly limit
            </p>
            <p className="text-xs text-red-700 mt-1">
              Upgrade your plan to generate more content or wait until your usage resets.
            </p>
          </div>
        )}
        
        {isNearLimit && !isAtLimit && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-900">
              You're approaching your monthly limit
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Consider upgrading your plan to avoid interruptions.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}