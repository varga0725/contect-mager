import React from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

export function SubscriptionCancelPage() {
  const handleRetryUpgrade = () => {
    window.location.href = '/subscription';
  };

  const handleGoToDashboard = () => {
    window.location.href = '/dashboard';
  };

  const handleContactSupport = () => {
    window.open('mailto:support@contentmagic.com', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        {/* Cancel Icon */}
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg 
            className="w-8 h-8 text-yellow-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>

        {/* Cancel Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Subscription Canceled
        </h1>
        <p className="text-gray-600 mb-6">
          Your subscription upgrade was canceled. No charges were made to your account.
        </p>

        {/* Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">What happens now?</h3>
          <ul className="text-sm text-blue-800 space-y-1 text-left">
            <li>• You can continue using your current plan</li>
            <li>• No changes to your existing features</li>
            <li>• You can upgrade anytime in the future</li>
            <li>• Your account remains active</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handleRetryUpgrade}
            className="w-full"
          >
            Try Upgrading Again
          </Button>
          <Button 
            onClick={handleGoToDashboard}
            variant="outline"
            className="w-full"
          >
            Return to Dashboard
          </Button>
        </div>

        {/* Support Link */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">
            Need help with your subscription?
          </p>
          <Button 
            onClick={handleContactSupport}
            variant="ghost"
            size="sm"
          >
            Contact Support
          </Button>
        </div>
      </Card>
    </div>
  );
}