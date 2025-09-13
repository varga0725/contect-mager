import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

export interface UsageData {
  currentUsage: number;
  monthlyLimit: number;
  tier: 'free' | 'pro' | 'creator';
  resetDate: string;
  remainingPosts: number;
}

export interface UsageLimitDisplayProps {
  usage?: UsageData;
  isLoading: boolean;
  className?: string;
}

export function UsageLimitDisplay({ usage, isLoading, className }: UsageLimitDisplayProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-2 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!usage) {
    return null;
  }

  const usagePercentage = (usage.currentUsage / usage.monthlyLimit) * 100;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = usage.remainingPosts === 0;
  
  const resetDate = new Date(usage.resetDate);
  const daysUntilReset = Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <Card className={`${className} ${isAtLimit ? 'border-destructive' : isNearLimit ? 'border-yellow-500' : ''}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm">
                Monthly Usage - {usage.tier.charAt(0).toUpperCase() + usage.tier.slice(1)} Plan
              </h3>
              <p className="text-xs text-muted-foreground">
                {usage.currentUsage} of {usage.monthlyLimit} posts used
              </p>
            </div>
            {usage.tier === 'free' && (
              <Button variant="outline" size="sm">
                Upgrade
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  isAtLimit 
                    ? 'bg-destructive' 
                    : isNearLimit 
                    ? 'bg-yellow-500' 
                    : 'bg-primary'
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{usage.remainingPosts} posts remaining</span>
              <span>Resets in {daysUntilReset} days</span>
            </div>
          </div>

          {/* Status Messages */}
          {isAtLimit && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="text-destructive text-sm">⚠️</span>
                <div>
                  <p className="text-sm font-medium text-destructive">
                    Monthly limit reached
                  </p>
                  <p className="text-xs text-destructive/80">
                    Upgrade your plan to generate more content or wait for your limit to reset.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isNearLimit && !isAtLimit && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600 text-sm">⚡</span>
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Approaching limit
                  </p>
                  <p className="text-xs text-yellow-700">
                    You have {usage.remainingPosts} posts remaining this month.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Upgrade Prompt for Free Users */}
          {usage.tier === 'free' && usagePercentage >= 50 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-900">
                  Need more content?
                </p>
                <p className="text-xs text-blue-800">
                  Upgrade to Pro for 100 posts/month or Creator for 500 posts/month
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    View Plans
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Plan Comparison */}
          {usage.tier === 'free' && (
            <PlanComparison currentTier={usage.tier} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PlanComparison({ currentTier }: { currentTier: string }) {
  const plans = [
    {
      name: 'Free',
      posts: 10,
      price: '$0',
      features: ['Basic AI generation', 'Content library', 'Mobile app'],
      current: currentTier === 'free',
    },
    {
      name: 'Pro',
      posts: 100,
      price: '$19.99',
      features: ['Advanced AI models', 'Scheduling', 'Analytics', 'Priority support'],
      current: currentTier === 'pro',
    },
    {
      name: 'Creator',
      posts: 500,
      price: '$49.99',
      features: ['Unlimited AI styles', 'Team collaboration', 'Custom branding', 'API access'],
      current: currentTier === 'creator',
    },
  ];

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Available Plans</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`p-3 rounded-lg border text-center ${
              plan.current 
                ? 'border-primary bg-primary/5' 
                : 'border-muted bg-muted/30'
            }`}
          >
            <div className="space-y-1">
              <div className="font-medium text-sm">{plan.name}</div>
              <div className="text-xs text-muted-foreground">
                {plan.posts} posts/month
              </div>
              <div className="font-medium text-sm">{plan.price}/mo</div>
              {plan.current && (
                <div className="text-xs text-primary font-medium">Current Plan</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}