import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UsageTracker } from '../UsageTracker';
import * as subscriptionHooks from '../../../hooks/useSubscription';

// Mock the subscription hooks
vi.mock('../../../hooks/useSubscription');

const mockUseSubscriptionUsage = vi.mocked(subscriptionHooks.useSubscriptionUsage);

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

describe('UsageTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    mockUseSubscriptionUsage.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(
      <TestWrapper>
        <UsageTracker />
      </TestWrapper>
    );

    expect(screen.getByText('Loading usage data...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const error = new Error('Failed to fetch usage');
    mockUseSubscriptionUsage.mockReturnValue({
      data: undefined,
      isLoading: false,
      error,
    } as any);

    render(
      <TestWrapper>
        <UsageTracker />
      </TestWrapper>
    );

    expect(screen.getByText('Failed to load usage data')).toBeInTheDocument();
  });

  it('renders usage data for free tier', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);

    mockUseSubscriptionUsage.mockReturnValue({
      data: {
        success: true,
        data: {
          currentUsage: 7,
          monthlyLimit: 10,
          tier: 'free',
          resetDate: futureDate,
          remainingPosts: 3,
        },
      },
      isLoading: false,
      error: null,
    } as any);

    render(
      <TestWrapper>
        <UsageTracker />
      </TestWrapper>
    );

    expect(screen.getByText('Usage Overview')).toBeInTheDocument();
    expect(screen.getByText('free Plan')).toBeInTheDocument();
    expect(screen.getByText('7 / 10')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument(); // Posts Used
    expect(screen.getByText('3')).toBeInTheDocument(); // Posts Left
    expect(screen.getByText('3 posts remaining')).toBeInTheDocument();
    expect(screen.getByText('70.0% used')).toBeInTheDocument();
  });

  it('renders usage data for pro tier', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 20);

    mockUseSubscriptionUsage.mockReturnValue({
      data: {
        success: true,
        data: {
          currentUsage: 45,
          monthlyLimit: 100,
          tier: 'pro',
          resetDate: futureDate,
          remainingPosts: 55,
        },
      },
      isLoading: false,
      error: null,
    } as any);

    render(
      <TestWrapper>
        <UsageTracker />
      </TestWrapper>
    );

    expect(screen.getByText('pro Plan')).toBeInTheDocument();
    expect(screen.getByText('45 / 100')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument(); // Posts Used
    expect(screen.getByText('55')).toBeInTheDocument(); // Posts Left
    expect(screen.getByText('55 posts remaining')).toBeInTheDocument();
    expect(screen.getByText('45.0% used')).toBeInTheDocument();
  });

  it('shows warning when near usage limit', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    mockUseSubscriptionUsage.mockReturnValue({
      data: {
        success: true,
        data: {
          currentUsage: 85,
          monthlyLimit: 100,
          tier: 'pro',
          resetDate: futureDate,
          remainingPosts: 15,
        },
      },
      isLoading: false,
      error: null,
    } as any);

    render(
      <TestWrapper>
        <UsageTracker />
      </TestWrapper>
    );

    expect(screen.getByText("You're approaching your monthly limit")).toBeInTheDocument();
    expect(screen.getByText('Consider upgrading your plan to avoid interruptions.')).toBeInTheDocument();
  });

  it('shows error when at usage limit', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    mockUseSubscriptionUsage.mockReturnValue({
      data: {
        success: true,
        data: {
          currentUsage: 10,
          monthlyLimit: 10,
          tier: 'free',
          resetDate: futureDate,
          remainingPosts: 0,
        },
      },
      isLoading: false,
      error: null,
    } as any);

    render(
      <TestWrapper>
        <UsageTracker />
      </TestWrapper>
    );

    expect(screen.getByText("You've reached your monthly limit")).toBeInTheDocument();
    expect(screen.getByText('Upgrade your plan to generate more content or wait until your usage resets.')).toBeInTheDocument();
  });

  it('calculates days until reset correctly', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

    mockUseSubscriptionUsage.mockReturnValue({
      data: {
        success: true,
        data: {
          currentUsage: 5,
          monthlyLimit: 10,
          tier: 'free',
          resetDate: futureDate,
          remainingPosts: 5,
        },
      },
      isLoading: false,
      error: null,
    } as any);

    render(
      <TestWrapper>
        <UsageTracker />
      </TestWrapper>
    );

    expect(screen.getByText('Usage resets in 7 days')).toBeInTheDocument();
  });

  it('handles singular day correctly', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1); // 1 day from now

    mockUseSubscriptionUsage.mockReturnValue({
      data: {
        success: true,
        data: {
          currentUsage: 8,
          monthlyLimit: 10,
          tier: 'free',
          resetDate: futureDate,
          remainingPosts: 2,
        },
      },
      isLoading: false,
      error: null,
    } as any);

    render(
      <TestWrapper>
        <UsageTracker />
      </TestWrapper>
    );

    expect(screen.getByText('Usage resets in 1 day')).toBeInTheDocument();
  });

  it('shows correct progress bar color based on usage', () => {
    // Test green color for low usage
    mockUseSubscriptionUsage.mockReturnValue({
      data: {
        success: true,
        data: {
          currentUsage: 3,
          monthlyLimit: 10,
          tier: 'free',
          resetDate: new Date(),
          remainingPosts: 7,
        },
      },
      isLoading: false,
      error: null,
    } as any);

    const { rerender } = render(
      <TestWrapper>
        <UsageTracker />
      </TestWrapper>
    );

    // Check for green progress bar (low usage)
    let progressBar = document.querySelector('.bg-green-500');
    expect(progressBar).toBeInTheDocument();

    // Test yellow color for high usage (80%+)
    mockUseSubscriptionUsage.mockReturnValue({
      data: {
        success: true,
        data: {
          currentUsage: 85,
          monthlyLimit: 100,
          tier: 'pro',
          resetDate: new Date(),
          remainingPosts: 15,
        },
      },
      isLoading: false,
      error: null,
    } as any);

    rerender(
      <TestWrapper>
        <UsageTracker />
      </TestWrapper>
    );

    // Check for yellow progress bar (high usage)
    progressBar = document.querySelector('.bg-yellow-500');
    expect(progressBar).toBeInTheDocument();

    // Test red color for at limit
    mockUseSubscriptionUsage.mockReturnValue({
      data: {
        success: true,
        data: {
          currentUsage: 10,
          monthlyLimit: 10,
          tier: 'free',
          resetDate: new Date(),
          remainingPosts: 0,
        },
      },
      isLoading: false,
      error: null,
    } as unknown);

    rerender(
      <TestWrapper>
        <UsageTracker />
      </TestWrapper>
    );

    // Check for red progress bar (at limit)
    progressBar = document.querySelector('.bg-red-500');
    expect(progressBar).toBeInTheDocument();
  });
});