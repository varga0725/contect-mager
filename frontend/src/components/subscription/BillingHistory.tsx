import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface BillingRecord {
  id: string;
  date: Date;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  invoiceUrl?: string;
}

// Mock billing data - in a real app, this would come from the API
const mockBillingHistory: BillingRecord[] = [
  {
    id: 'inv_001',
    date: new Date('2024-01-15'),
    amount: 19.99,
    status: 'paid',
    description: 'Pro Plan - Monthly Subscription',
    invoiceUrl: '#',
  },
  {
    id: 'inv_002',
    date: new Date('2023-12-15'),
    amount: 19.99,
    status: 'paid',
    description: 'Pro Plan - Monthly Subscription',
    invoiceUrl: '#',
  },
  {
    id: 'inv_003',
    date: new Date('2023-11-15'),
    amount: 19.99,
    status: 'paid',
    description: 'Pro Plan - Monthly Subscription',
    invoiceUrl: '#',
  },
];

export function BillingHistory() {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Billing History</h3>
        <Button variant="outline" size="sm">
          Download All
        </Button>
      </div>

      {mockBillingHistory.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600">No billing history available</p>
          <p className="text-sm text-gray-500 mt-1">
            Your billing history will appear here once you have a paid subscription
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {mockBillingHistory.map((record) => (
            <div 
              key={record.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {record.description}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(record.date)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatAmount(record.amount)}
                  </p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(record.status)}`}>
                    {getStatusText(record.status)}
                  </span>
                </div>

                {record.invoiceUrl && record.status === 'paid' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(record.invoiceUrl, '_blank')}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Invoice
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Note */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Need help with billing? Contact our support team for assistance.
        </p>
      </div>
    </Card>
  );
}