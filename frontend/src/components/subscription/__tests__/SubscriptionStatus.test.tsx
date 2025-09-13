import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SubscriptionStatus } from '../SubscriptionStatus';
import * as subscriptionHooks from '../../../hooks/useSubscription';

// Mock the subscription hooks
vi.mock('../../../hooks/useSubscription');

const mockUseSubscriptionStatus = vi.mocked(subscriptionHooks.useSubscriptionStatus);
const mockUseCancelSubscription = vi.mocked(subscriptionHooks.useCancelSubscription);

// Test wrapper with QueryClient
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('SubscriptionStatus', () => {
  const mockOnUpgrade = vi.fn();
  const mockCancelMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock for cancel subscription
    mockUseCancelSubscription.mockReturnValue({
      mutateAsync: mockCancelMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);
  });

  it('renders loading state', () => {
    mockUseSubscriptionStatus.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(
      <TestWrapper>
        <SubscriptionStatus onUpgrade={mockOnUpgrade} />
      </TestWrapper>
    );

    expect(screen.getByText('Loading subscription status...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const error = new Error('Failed to fetch');
    mockUseSubscriptionStatus.mockReturnValue({
      data: undefined,
      isLoading: false,
      error,
    } as any);

    render(
      <TestWrapper>
        <SubscriptionStatus onUpgrade={mockOnUpgrade} />
      </TestWrapper>
    );

    expect(screen.getByText('Failed to load subscription status')).toBeInTheDocument();
  });

  it('renders free tier subscription status', () => {
    mockUseSubscriptionStatus.mockReturnValue({
      data: {
        success: true,
        data: {
          subscription: null,
          usage: {
            currentUsage: 5,
            monthlyLimit: 10,
            tier: 'free',
            resetDate: new Date('2024-02-15'),
            remainingPosts: 5,
          },
        },
      },
      isLoading: false,
      error: null,
    } as any);

    render(
      <TestWrapper>
        <SubscriptionStatus onUpgrade={mockOnUpgrade} />
      </TestWrapper>
    );

    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Free Plan')).toBeInTheDocument();
    expect(screen.getByText('5 / 10')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to Creator')).toBeInTheDocument();
  });

  it('renders pro tier subscription status', () => {
    mockUseSubscriptionStatus.mockReturnValue({
      data: {
        success: true,
        data: {
          subscription: {
            id: 1,
            status: 'active',
            currentPeriodEnd: new Date('2024-02-15'),
          },
          usage: {
            currentUsage: 25,
            monthlyLimit: 100,
            tier: 'pro',
            resetDate: new Date('2024-02-15'),
            remainingPosts: 75,
          },
        },
      },
      isLoading: false,
      error: null,
    } as any);

    render(
      <TestWrapper>
        <SubscriptionStatus onUpgrade={mockOnUpgrade} />
      </TestWrapper>
    );

    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Pro Plan')).toBeInTheDocument();
    expect(screen.getByText('25 / 100')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to Creator')).toBeInTheDocument();
    expect(screen.getByText('Cancel Plan')).toBeInTheDocument();
  });

  it('renders creator tier subscription status', () => {
    mockUseSubscriptionStatus.mockReturnValue({
      data: {
        success: true,
        data: {
          subscription: {
            id: 1,
            status: 'active',
            currentPeriodEnd: new Date('2024-02-15'),
          },
          usage: {
            currentUsage: 150,
            monthlyLimit: 500,
            tier: 'creator',
            resetDate: new Date('2024-02-15'),
            remainingPosts: 350,
          },
        },
      },
      isLoading: false,
      error: null,
    } as any);

    render(
      <TestWrapper>
        <SubscriptionStatus onUpgrade={mockOnUpgrade} />
      </TestWrapper>
    );

    expect(screen.getByText('Creator')).toBeInTheDocument();
    expect(screen.getByText('Creator Plan')).toBeInTheDocument();
    expect(screen.getByText('150 / 500')).toBeInTheDocument();
    expect(screen.getByText('Cancel Plan')).toBeInTheDocument();
  });

  it('calls onUpgrade when upgrade buttons are clicked', () => {
    mockUseSubscriptionStatus.mockReturnValue({
      data: {
        success: true,
        data: {
          subscription: null,
          usage: {
            currentUsage: 5,
            monthlyLimit: 10,
            tier: 'free',
            resetDate: new Date('2024-02-15'),
            remainingPosts: 5,
          },
        },
      },
      isLoading: false,
      error: null,
    } as any);

    render(
      <TestWrapper>
        <SubscriptionStatus onUpgrade={mockOnUpgrade} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Upgrade to Pro'));
    expect(mockOnUpgrade).toHaveBeenCalledWith('pro');

    fireEvent.click(screen.getByText('Upgrade to Creator'));
    expect(mockOnUpgrade).toHaveBeenCalledWith('creator');
  });

  it('handles subscription cancellation', async () => {
    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => true);

    mockUseSubscriptionStatus.mockReturnValue({
      data: {
        success: true,
        data: {
          subscription: {
            id: 1,
            status: 'active',
            currentPeriodEnd: new Date('2024-02-15'),
          },
          usage: {
            currentUsage: 25,
            monthlyLimit: 100,
            tier: 'pro',
            resetDate: new Date('2024-02-15'),
            remainingPosts: 75,
          },
        },
      },
      isLoading: false,
      error: null,
    } as any);

    render(
      <TestWrapper>
        <SubscriptionStatus onUpgrade={mockOnUpgrade} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Cancel Plan'));

    await waitFor(() => {
      expect(mockCancelMutate).toHaveBeenCalled();
    });

    // Restore window.confirm
    window.confirm = originalConfirm;
  });

  it('shows canceled subscription notice', () => {
    mockUseSubscriptionStatus.mockReturnValue({
      data: {
        success: true,
        data: {
          subscription: {
            id: 1,
            status: 'canceled',
            currentPeriodEnd: new Date('2024-02-15'),
          },
          usage: {
            currentUsage: 25,
            monthlyLimit: 100,
            tier: 'pro',
            resetDate: new Date('2024-02-15'),
            remainingPosts: 75,
          },
        },
      },
      isLoading: false,
      error: null,
    } as any);

    render(
      <TestWrapper>
        <SubscriptionStatus onUpgrade={mockOnUpgrade} />
      </TestWrapper>
    );

    expect(screen.getByText(/Your subscription has been canceled/)).toBeInTheDocument();
  });

  it('shows loading state when canceling subscription', () => {
    mockUseCancelSubscription.mockReturnValue({
      mutateAsync: mockCancelMutate,
      isPending: true,
      isError: false,
      error: null,
    } as any);

    mockUseSubscriptionStatus.mockReturnValue({
      data: {
        success: true,
        data: {
          subscription: {
            id: 1,
            status: 'active',
            currentPeriodEnd: new Date('2024-02-15'),
          },
          usage: {
            currentUsage: 25,
            monthlyLimit: 100,
            tier: 'pro',
            resetDate: new Date('2024-02-15'),
            remainingPosts: 75,
          },
        },
      },
      isLoading: false,
      error: null,
    } as unknown);

    render(
      <TestWrapper>
        <SubscriptionStatus onUpgrade={mockOnUpgrade} />
      </TestWrapper>
    );

    expect(screen.getByText('Canceling...')).toBeInTheDocument();
  });
});