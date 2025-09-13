import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { LoadingSpinner } from '../ui/loading-spinner';
import { ErrorMessage } from '../ui/error-message';
import { useSubscriptionStatus, useCancelSubscription } from '../../hooks/useSubscription';
import type { SubscriptionTier } from '../../types';

const TIER_COLORS = {
  free: 'bg-gray-100 text-gray-800',
  pro: 'bg-blue-100 text-blue-800',
  creator: 'bg-purple-100 text-purple-800',
} as const;

const TIER_NAMES = {
  free: 'Free',
  pro: 'Pro',
  creator: 'Creator',
} as const;

interface SubscriptionStatusProps {
  onUpgrade?: (tier: SubscriptionTier) => void;
}

export function SubscriptionStatus({ onUpgrade }: SubscriptionStatusProps) {
  const { data, isLoading, error } = useSubscriptionStatus();
  const cancelMutation = useCancelSubscription();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="md" />
          <span className="ml-2">Loading subscription status...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <ErrorMessage 
          error="Failed to load subscription status"
        />
      </Card>
    );
  }

  if (!data?.success || !data.data) {
    return (
      <Card className="p-6">
        <ErrorMessage message="No subscription data available" />
      </Card>
    );
  }

  const { subscription, usage } = data.data;
  const currentTier = usage.tier;
  const isActive = subscription?.status === 'active';
  const isCanceled = subscription?.status === 'canceled';

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      try {
        await cancelMutation.mutateAsync();
      } catch (error) {
        console.error('Failed to cancel subscription:', error);
      }
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Subscription Status</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${TIER_COLORS[currentTier]}`}>
          {TIER_NAMES[currentTier]}
        </span>
      </div>

      <div className="space-y-4">
        {/* Current Plan Info */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Current Plan</p>
          <p className="font-medium">{TIER_NAMES[currentTier]} Plan</p>
          {currentTier !== 'free' && subscription && (
            <p className="text-sm text-gray-500">
              {isActive && !isCanceled && `Renews on ${formatDate(subscription.currentPeriodEnd)}`}
              {isCanceled && `Expires on ${formatDate(subscription.currentPeriodEnd)}`}
            </p>
          )}
        </div>

        {/* Usage Info */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Monthly Usage</p>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((usage.currentUsage / usage.monthlyLimit) * 100, 100)}%` }}
              />
            </div>
            <span className="text-sm font-medium">
              {usage.currentUsage} / {usage.monthlyLimit}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Resets on {formatDate(usage.resetDate)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          {currentTier === 'free' && (
            <>
              <Button 
                onClick={() => onUpgrade?.('pro')}
                className="flex-1"
              >
                Upgrade to Pro
              </Button>
              <Button 
                onClick={() => onUpgrade?.('creator')}
                variant="outline"
                className="flex-1"
              >
                Upgrade to Creator
              </Button>
            </>
          )}
          
          {currentTier === 'pro' && (
            <>
              <Button 
                onClick={() => onUpgrade?.('creator')}
                className="flex-1"
              >
                Upgrade to Creator
              </Button>
              {isActive && !isCanceled && (
                <Button 
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1"
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? 'Canceling...' : 'Cancel Plan'}
                </Button>
              )}
            </>
          )}
          
          {currentTier === 'creator' && isActive && !isCanceled && (
            <Button 
              onClick={handleCancel}
              variant="outline"
              className="w-full"
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Canceling...' : 'Cancel Plan'}
            </Button>
          )}
        </div>

        {/* Cancellation Notice */}
        {isCanceled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              Your subscription has been canceled and will expire on {formatDate(subscription!.currentPeriodEnd)}. 
              You can still use premium features until then.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}