import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { SUBSCRIPTION_QUERY_KEYS } from '../hooks/useSubscription';

export function SubscriptionSuccessPage() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Invalidate subscription queries to refetch updated data
    queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEYS.all });
  }, [queryClient]);

  const handleGoToDashboard = () => {
    window.location.href = '/dashboard';
  };

  const handleViewSubscription = () => {
    window.location.href = '/subscription';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg 
            className="w-8 h-8 text-green-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Subscription Activated!
        </h1>
        <p className="text-gray-600 mb-6">
          Welcome to your new plan! Your subscription has been successfully activated 
          and you now have access to all premium features.
        </p>

        {/* Features List */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">What's included:</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Increased monthly post limit
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Advanced AI content generation
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Content scheduling & analytics
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Priority support
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handleGoToDashboard}
            className="w-full"
          >
            Go to Dashboard
          </Button>
          <Button 
            onClick={handleViewSubscription}
            variant="outline"
            className="w-full"
          >
            View Subscription Details
          </Button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-gray-500 mt-6">
          You will receive a confirmation email shortly with your subscription details.
        </p>
      </Card>
    </div>
  );
}