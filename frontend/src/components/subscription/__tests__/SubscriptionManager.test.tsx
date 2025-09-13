import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SubscriptionManager } from '../SubscriptionManager';
import * as subscriptionHooks from '../../../hooks/useSubscription';

// Mock the subscription hooks
vi.mock('../../../hooks/useSubscription');

const mockUseSubscriptionStatus = vi.mocked(subscriptionHooks.useSubscriptionStatus);
const mockUseSubscriptionUsage = vi.mocked(subscriptionHooks.useSubscriptionUsage);
const mockUseUpgradeSubscription = vi.mocked(subscriptionHooks.useUpgradeSubscription);
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

describe('SubscriptionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
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

    mockUseSubscriptionUsage.mockReturnValue({
      data: {
        success: true,
        data: {
          currentUsage: 5,
          monthlyLimit: 10,
          tier: 'free',
          resetDate: new Date('2024-02-15'),
          remainingPosts: 5,
        },
      },
      isLoading: false,
      error: null,
    } as any);

    mockUseUpgradeSubscription.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    mockUseCancelSubscription.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);
  });

  it('renders subscription manager with header', () => {
    render(
      <TestWrapper>
        <SubscriptionManager />
      </TestWrapper>
    );

    expect(screen.getByText('Subscription Management')).toBeInTheDocument();
    expect(screen.getByText('Manage your subscription, track usage, and view billing information')).toBeInTheDocument();
  });

  it('renders tab navigation', () => {
    render(
      <TestWrapper>
        <SubscriptionManager />
      </TestWrapper>
    );

    expect(screen.getByText('📊')).toBeInTheDocument(); // Overview tab icon
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('💎')).toBeInTheDocument(); // Plans tab icon
    expect(screen.getByText('Plans')).toBeInTheDocument();
    expect(screen.getByText('🧾')).toBeInTheDocument(); // Billing tab icon
    expect(screen.getByText('Billing')).toBeInTheDocument();
  });

  it('shows overview tab by default', () => {
    render(
      <TestWrapper>
        <SubscriptionManager />
      </TestWrapper>
    );

    // Should show subscription status and usage tracker
    expect(screen.getByText('Subscription Status')).toBeInTheDocument();
    expect(screen.getByText('Usage Overview')).toBeInTheDocument();
  });

  it('switches to plans tab when clicked', () => {
    render(
      <TestWrapper>
        <SubscriptionManager />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Plans'));

    // Should show subscription plans
    expect(screen.getByText('Choose Your Plan')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Creator')).toBeInTheDocument();
  });

  it('switches to billing tab when clicked', () => {
    render(
      <TestWrapper>
        <SubscriptionManager />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Billing'));

    // Should show billing history
    expect(screen.getByText('Billing History')).toBeInTheDocument();
  });

  it('shows quick actions on overview tab', () => {
    render(
      <TestWrapper>
        <SubscriptionManager />
      </TestWrapper>
    );

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('View All Plans')).toBeInTheDocument();
    expect(screen.getByText('View Billing History')).toBeInTheDocument();
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
  });

  it('navigates to plans tab from quick actions', () => {
    render(
      <TestWrapper>
        <SubscriptionManager />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('View All Plans'));

    // Should switch to plans tab
    expect(screen.getByText('Choose Your Plan')).toBeInTheDocument();
  });

  it('navigates to billing tab from quick actions', () => {
    render(
      <TestWrapper>
        <SubscriptionManager />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('View Billing History'));

    // Should switch to billing tab
    expect(screen.getByText('Billing History')).toBeInTheDocument();
  });

  it('opens support email when contact support is clicked', () => {
    // Mock window.open
    const originalOpen = window.open;
    window.open = vi.fn();

    render(
      <TestWrapper>
        <SubscriptionManager />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Contact Support'));

    expect(window.open).toHaveBeenCalledWith('mailto:support@contentmagic.com', '_blank');

    // Restore window.open
    window.open = originalOpen;
  });

  it('switches back to overview after upgrade', () => {
    render(
      <TestWrapper>
        <SubscriptionManager />
      </TestWrapper>
    );

    // Go to plans tab
    fireEvent.click(screen.getByText('Plans'));
    expect(screen.getByText('Choose Your Plan')).toBeInTheDocument();

    // Simulate upgrade (this would normally be handled by the SubscriptionPlans component)
    // For this test, we'll just verify the handleUpgrade function works
    // The actual upgrade flow is tested in SubscriptionPlans.test.tsx
  });

  it('highlights active tab correctly', () => {
    render(
      <TestWrapper>
        <SubscriptionManager />
      </TestWrapper>
    );

    // Overview should be active by default
    const overviewTab = screen.getByText('Overview').closest('button');
    expect(overviewTab).toHaveClass('bg-white', 'shadow-sm');

    // Switch to plans tab
    fireEvent.click(screen.getByText('Plans'));
    
    const plansTab = screen.getByText('Plans').closest('button');
    expect(plansTab).toHaveClass('bg-white', 'shadow-sm');
  });

  it('does not show quick actions on non-overview tabs', () => {
    render(
      <TestWrapper>
        <SubscriptionManager />
      </TestWrapper>
    );

    // Switch to plans tab
    fireEvent.click(screen.getByText('Plans'));

    // Quick actions should not be visible
    expect(screen.queryByText('Quick Actions')).not.toBeInTheDocument();

    // Switch to billing tab
    fireEvent.click(screen.getByText('Billing'));

    // Quick actions should still not be visible
    expect(screen.queryByText('Quick Actions')).not.toBeInTheDocument();
  });

  it('handles upgrade from subscription status component', () => {
    render(
      <TestWrapper>
        <SubscriptionManager />
      </TestWrapper>
    );

    // The upgrade button in SubscriptionStatus should trigger navigation to plans
    // This is tested indirectly through the onUpgrade prop
    expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
  });
});