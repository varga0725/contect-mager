import React, { useState } from 'react';
import { SubscriptionStatus } from './SubscriptionStatus';
import { UsageTracker } from './UsageTracker';
import { SubscriptionPlans } from './SubscriptionPlans';
import { BillingHistory } from './BillingHistory';
import { Button } from '../ui/button';
import type { SubscriptionTier } from '../../types';

type TabType = 'overview' | 'plans' | 'billing';

export function SubscriptionManager() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const handleUpgrade = (tier: SubscriptionTier) => {
    // The upgrade is handled by the SubscriptionPlans component
    // After successful upgrade, we can switch back to overview
    setActiveTab('overview');
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: '📊' },
    { id: 'plans' as const, label: 'Plans', icon: '💎' },
    { id: 'billing' as const, label: 'Billing', icon: '🧾' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Subscription Management
        </h1>
        <p className="text-gray-600">
          Manage your subscription, track usage, and view billing information
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SubscriptionStatus onUpgrade={() => setActiveTab('plans')} />
            <UsageTracker />
          </div>
        )}

        {activeTab === 'plans' && (
          <SubscriptionPlans 
            onPlanSelect={handleUpgrade}
            showCurrentPlan={true}
          />
        )}

        {activeTab === 'billing' && (
          <BillingHistory />
        )}
      </div>

      {/* Quick Actions */}
      {activeTab === 'overview' && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => setActiveTab('plans')}
              variant="outline"
            >
              View All Plans
            </Button>
            <Button 
              onClick={() => setActiveTab('billing')}
              variant="outline"
            >
              View Billing History
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open('mailto:support@contentmagic.com', '_blank')}
            >
              Contact Support
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}