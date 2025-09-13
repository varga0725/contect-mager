import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SubscriptionPlans } from '../SubscriptionPlans';
import * as subscriptionHooks from '../../../hooks/useSubscription';

// Mock the subscription hooks
vi.mock('../../../hooks/useSubscription');

const mockUseSubscriptionStatus = vi.mocked(subscriptionHooks.useSubscriptionStatus);
const mockUseUpgradeSubscription = vi.mocked(subscriptionHooks.useUpgradeSubscription);

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

describe('SubscriptionPlans', () => {
  const mockOnPlanSelect = vi.fn();
  const mockUpgradeMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock for upgrade subscription
    mockUseUpgradeSubscription.mockReturnValue({
      mutateAsync: mockUpgradeMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);
  });

  it('renders all subscription plans', () => {
    mockUseSubscriptionStatus.mockReturnValue({
      data: {
        data: {
          usage: { tier: 'free' },
        },
      },
    } as any);

    render(
      <TestWrapper>
        <SubscriptionPlans onPlanSelect={mockOnPlanSelect} />
      </TestWrapper>
    );

    expect(screen.getByText('Choose Your Plan')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Creator')).toBeInTheDocument();
  });

  it('shows plan features correctly', () => {
    mockUseSubscriptionStatus.mockReturnValue({
      data: {
        data: {
          usage: { tier: 'free' },
        },
      },
    } as any);

    render(
      <TestWrapper>
        <SubscriptionPlans onPlanSelect={mockOnPlanSelect} />
      </TestWrapper>
    );

    // Check Free plan features (appears in both pricing and features list)
    expect(screen.getAllByText('10 posts per month')).toHaveLength(2);
    expect(screen.getByText('Basic AI content generation')).toBeInTheDocument();
    expect(screen.getByText('Community support')).toBeInTheDocument();

    // Check Pro plan features (appears in both pricing and features list)
    expect(screen.getAllByText('100 posts per month')).toHaveLength(2);
    expect(screen.getAllByText('Advanced AI content generation')).toHaveLength(2); // Pro and Creator both have this
    expect(screen.getByText('Priority support')).toBeInTheDocument();

    // Check Creator plan features (appears in both pricing and features list)
    expect(screen.getAllByText('500 posts per month')).toHaveLength(2);
    expect(screen.getByText('Team collaboration')).toBeInTheDocument();
    expect(screen.getByText('Dedicated support')).toBeInTheDocument();
  });

  it('shows pricing correctly', () => {
    mockUseSubscriptionStatus.mockReturnValue({
      data: {
        data: {
          usage: { tier: 'free' },
        },
      },
    } as any);

    render(
      <TestWrapper>
        <SubscriptionPlans onPlanSelect={mockOnPlanSelect} />
      </TestWrapper>
    );

    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('$19.99')).toBeInTheDocument();
    expect(screen.getByText('$49.99')).toBeInTheDocument();
  });

  it('highlights popular plan', () => {
    mockUseSubscriptionStatus.mockReturnValue({
      data: {
        data: {
          usage: { tier: 'free' },
        },
      },
    } as any);

    render(
      <TestWrapper>
        <SubscriptionPlans onPlanSelect={mockOnPlanSelect} />
      </TestWrapper>
    );

    expect(screen.getByText('Most Popular')).toBeInTheDocument();
  });

  it('shows current plan badge when showCurrentPlan is true', () => {
    mockUseSubscriptionStatus.mockReturnValue({
      data: {
        data: {
          usage: { tier: 'pro' },
        },
      },
    } as any);

    render(
      <TestWrapper>
        <SubscriptionPlans onPlanSelect={mockOnPlanSelect} showCurrentPlan={true} />
      </TestWrapper>
    );

    expect(screen.getAllByText('Current Plan')).toHaveLength(2); // Badge and button
  });

  it('enables upgrade buttons for higher tiers only', () => {
    mockUseSubscriptionStatus.mockReturnValue({
      data: {
        data: {
          usage: { tier: 'free' },
        },
      },
    } as any);

    render(
      <TestWrapper>
        <SubscriptionPlans onPlanSelect={mockOnPlanSelect} />
      </TestWrapper>
    );

    // Free plan should show "Current Plan" button (disabled) when it's the current tier
    const currentPlanButtons = screen.getAllByText('Current Plan');
    expect(currentPlanButtons).toHaveLength(2); // Badge and button
    expect(currentPlanButtons[1]).toBeDisabled(); // The button should be disabled

    // Pro and Creator should show upgrade buttons
    expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to Creator')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to Pro')).not.toBeDisabled();
    expect(screen.getByText('Upgrade to Creator')).not.toBeDisabled();
  });

  it('handles upgrade button clicks', async () => {
    mockUseSubscriptionStatus.mockReturnValue({
      data: {
        data: {
          usage: { tier: 'free' },
        },
      },
    } as any);

    render(
      <TestWrapper>
        <SubscriptionPlans onPlanSelect={mockOnPlanSelect} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Upgrade to Pro'));

    await waitFor(() => {
      expect(mockUpgradeMutate).toHaveBeenCalledWith('pro');
    });
  });

  it('calls onPlanSelect after successful upgrade', async () => {
    mockUseSubscriptionStatus.mockReturnValue({
      data: {
        data: {
          usage: { tier: 'free' },
        },
      },
    } as any);

    mockUpgradeMutate.mockResolvedValue({ success: true });

    render(
      <TestWrapper>
        <SubscriptionPlans onPlanSelect={mockOnPlanSelect} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Upgrade to Creator'));

    await waitFor(() => {
      expect(mockUpgradeMutate).toHaveBeenCalledWith('creator');
      expect(mockOnPlanSelect).toHaveBeenCalledWith('creator');
    });
  });

  it('shows loading state during upgrade', () => {
    mockUseSubscriptionStatus.mockReturnValue({
      data: {
        data: {
          usage: { tier: 'free' },
        },
      },
    } as any);

    mockUseUpgradeSubscription.mockReturnValue({
      mutateAsync: mockUpgradeMutate,
      isPending: true,
      isError: false,
      error: null,
    } as any);

    render(
      <TestWrapper>
        <SubscriptionPlans onPlanSelect={mockOnPlanSelect} />
      </TestWrapper>
    );

    expect(screen.getAllByText('Processing...')).toHaveLength(2); // Both Pro and Creator buttons show loading
  });

  it('disables downgrade options correctly', () => {
    mockUseSubscriptionStatus.mockReturnValue({
      data: {
        data: {
          usage: { tier: 'creator' },
        },
      },
    } as any);

    render(
      <TestWrapper>
        <SubscriptionPlans onPlanSelect={mockOnPlanSelect} />
      </TestWrapper>
    );

    // Free should show "Free Plan" and Pro should show "Downgrade Not Available" for Creator user
    expect(screen.getByText('Free Plan')).toBeInTheDocument();
    expect(screen.getByText('Downgrade Not Available')).toBeInTheDocument();
    expect(screen.getAllByText('Current Plan')).toHaveLength(2); // Badge and button for Creator
  });

  it('shows correct button states for pro user', () => {
    mockUseSubscriptionStatus.mockReturnValue({
      data: {
        data: {
          usage: { tier: 'pro' },
        },
      },
    } as any);

    render(
      <TestWrapper>
        <SubscriptionPlans onPlanSelect={mockOnPlanSelect} />
      </TestWrapper>
    );

    // Free should show "Free Plan" (downgrade not available)
    expect(screen.getByText('Free Plan')).toBeInTheDocument();
    
    // Pro should show current plan (badge and button)
    expect(screen.getAllByText('Current Plan')).toHaveLength(2);
    
    // Creator should allow upgrade
    expect(screen.getByText('Upgrade to Creator')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to Creator')).not.toBeDisabled();
  });

  it('renders without showCurrentPlan', () => {
    mockUseSubscriptionStatus.mockReturnValue({
      data: {
        data: {
          usage: { tier: 'pro' },
        },
      },
    } as unknown);

    render(
      <TestWrapper>
        <SubscriptionPlans onPlanSelect={mockOnPlanSelect} showCurrentPlan={false} />
      </TestWrapper>
    );

    // Should not show current plan badge
    expect(screen.queryByText('Current Plan')).not.toBeInTheDocument();
  });
});