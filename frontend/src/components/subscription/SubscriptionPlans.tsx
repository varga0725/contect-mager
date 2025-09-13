import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { LoadingSpinner } from '../ui/loading-spinner';
import { useUpgradeSubscription, useSubscriptionStatus } from '../../hooks/useSubscription';
import type { SubscriptionTier, SubscriptionPlan } from '../../types';

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    tier: 'free',
    name: 'Free',
    price: 0,
    monthlyPosts: 10,
    features: [
      '10 posts per month',
      'Basic AI content generation',
      'Standard templates',
      'Community support',
    ],
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: 19.99,
    monthlyPosts: 100,
    popular: true,
    features: [
      '100 posts per month',
      'Advanced AI content generation',
      'Premium templates',
      'Content scheduling',
      'Analytics dashboard',
      'Priority support',
    ],
  },
  {
    tier: 'creator',
    name: 'Creator',
    price: 49.99,
    monthlyPosts: 500,
    features: [
      '500 posts per month',
      'Advanced AI content generation',
      'Premium templates',
      'Content scheduling',
      'Advanced analytics',
      'Team collaboration',
      'Custom branding',
      'Dedicated support',
    ],
  },
];

interface SubscriptionPlansProps {
  onPlanSelect?: (tier: SubscriptionTier) => void;
  showCurrentPlan?: boolean;
}

export function SubscriptionPlans({ onPlanSelect, showCurrentPlan = true }: SubscriptionPlansProps) {
  const { data: statusData } = useSubscriptionStatus();
  const upgradeMutation = useUpgradeSubscription();
  
  const currentTier = statusData?.data?.usage?.tier || 'free';

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (tier === 'free' || tier === currentTier) {
      return;
    }

    try {
      await upgradeMutation.mutateAsync(tier);
      onPlanSelect?.(tier);
    } catch (error) {
      console.error('Upgrade failed:', error);
    }
  };

  const isCurrentPlan = (tier: SubscriptionTier) => {
    return showCurrentPlan && tier === currentTier;
  };

  const canUpgrade = (tier: SubscriptionTier) => {
    if (tier === 'free') return false;
    
    const tierOrder = { free: 0, pro: 1, creator: 2 };
    return tierOrder[tier] > tierOrder[currentTier];
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose Your Plan
        </h2>
        <p className="text-gray-600">
          Upgrade to unlock more content generation and advanced features
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <Card 
            key={plan.tier}
            className={`relative p-6 ${
              plan.popular 
                ? 'border-blue-500 border-2 shadow-lg' 
                : isCurrentPlan(plan.tier)
                  ? 'border-green-500 border-2'
                  : ''
            }`}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}

            {/* Current Plan Badge */}
            {isCurrentPlan(plan.tier) && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Current Plan
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {plan.name}
              </h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">
                  ${plan.price}
                </span>
                {plan.price > 0 && (
                  <span className="text-gray-600">/month</span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {plan.monthlyPosts} posts per month
              </p>
            </div>

            {/* Features List */}
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg 
                    className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                  <span className="text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Action Button */}
            <div className="mt-auto">
              {isCurrentPlan(plan.tier) ? (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  disabled
                >
                  Current Plan
                </Button>
              ) : canUpgrade(plan.tier) ? (
                <Button 
                  onClick={() => handleUpgrade(plan.tier)}
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : ''
                  }`}
                  disabled={upgradeMutation.isPending}
                >
                  {upgradeMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Processing...
                    </>
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  disabled
                >
                  {plan.tier === 'free' ? 'Free Plan' : 'Downgrade Not Available'}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Additional Information */}
      <div className="text-center text-sm text-gray-600 space-y-2">
        <p>All plans include secure payment processing and can be canceled anytime.</p>
        <p>Usage resets monthly on your billing date.</p>
      </div>
    </div>
  );
}