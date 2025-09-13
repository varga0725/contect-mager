import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UsageLimitDisplay } from '../UsageLimitDisplay';
import type { UsageData } from '../UsageLimitDisplay';

describe('UsageLimitDisplay', () => {
  const mockUsageData: UsageData = {
    currentUsage: 5,
    monthlyLimit: 10,
    tier: 'free',
    resetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    remainingPosts: 5,
  };

  it('shows loading state when isLoading is true', () => {
    render(<UsageLimitDisplay usage={undefined} isLoading={true} />);

    // Should show loading skeleton
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('renders nothing when no usage data and not loading', () => {
    const { container } = render(<UsageLimitDisplay usage={undefined} isLoading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays usage statistics correctly', () => {
    render(<UsageLimitDisplay usage={mockUsageData} isLoading={false} />);

    expect(screen.getByText('Monthly Usage - Free Plan')).toBeInTheDocument();
    expect(screen.getByText('5 of 10 posts used')).toBeInTheDocument();
    expect(screen.getByText('5 posts remaining')).toBeInTheDocument();
    expect(screen.getByText(/Resets in \d+ days/)).toBeInTheDocument();
  });

  it('shows upgrade button for free tier users', () => {
    render(<UsageLimitDisplay usage={mockUsageData} isLoading={false} />);

    expect(screen.getByRole('button', { name: /Upgrade/i })).toBeInTheDocument();
  });

  it('does not show upgrade button for pro tier users', () => {
    const proUsageData: UsageData = {
      ...mockUsageData,
      tier: 'pro',
      monthlyLimit: 100,
    };

    render(<UsageLimitDisplay usage={proUsageData} isLoading={false} />);

    expect(screen.queryByRole('button', { name: /Upgrade/i })).not.toBeInTheDocument();
  });

  it('shows warning when approaching limit (80%+)', () => {
    const nearLimitUsage: UsageData = {
      ...mockUsageData,
      currentUsage: 8,
      remainingPosts: 2,
    };

    render(<UsageLimitDisplay usage={nearLimitUsage} isLoading={false} />);

    expect(screen.getByText('Approaching limit')).toBeInTheDocument();
    expect(screen.getByText('You have 2 posts remaining this month.')).toBeInTheDocument();
  });

  it('shows error state when at limit', () => {
    const atLimitUsage: UsageData = {
      ...mockUsageData,
      currentUsage: 10,
      remainingPosts: 0,
    };

    render(<UsageLimitDisplay usage={atLimitUsage} isLoading={false} />);

    expect(screen.getByText('Monthly limit reached')).toBeInTheDocument();
    expect(screen.getByText(/Upgrade your plan to generate more content/)).toBeInTheDocument();
  });

  it('applies correct progress bar styling based on usage', () => {
    const { rerender } = render(<UsageLimitDisplay usage={mockUsageData} isLoading={false} />);

    // Normal usage (50%) - should have primary color
    let progressBar = document.querySelector('.bg-primary');
    expect(progressBar).toBeInTheDocument();

    // Near limit (80%)
    const nearLimitUsage: UsageData = {
      ...mockUsageData,
      currentUsage: 8,
      remainingPosts: 2,
    };
    rerender(<UsageLimitDisplay usage={nearLimitUsage} isLoading={false} />);

    progressBar = document.querySelector('.bg-yellow-500');
    expect(progressBar).toBeInTheDocument();

    // At limit (100%)
    const atLimitUsage: UsageData = {
      ...mockUsageData,
      currentUsage: 10,
      remainingPosts: 0,
    };
    rerender(<UsageLimitDisplay usage={atLimitUsage} isLoading={false} />);

    progressBar = document.querySelector('.bg-destructive');
    expect(progressBar).toBeInTheDocument();
  });

  it('shows upgrade prompt for free users at 50%+ usage', () => {
    const halfUsageData: UsageData = {
      ...mockUsageData,
      currentUsage: 5,
      remainingPosts: 5,
    };

    render(<UsageLimitDisplay usage={halfUsageData} isLoading={false} />);

    expect(screen.getByText('Need more content?')).toBeInTheDocument();
    expect(screen.getByText(/Upgrade to Pro for 100 posts\/month/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View Plans/i })).toBeInTheDocument();
  });

  it('displays plan comparison for free users', () => {
    render(<UsageLimitDisplay usage={mockUsageData} isLoading={false} />);

    expect(screen.getByText('Available Plans')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Creator')).toBeInTheDocument();
    expect(screen.getByText('Current Plan')).toBeInTheDocument();
  });

  it('does not show plan comparison for non-free users', () => {
    const proUsageData: UsageData = {
      ...mockUsageData,
      tier: 'pro',
      monthlyLimit: 100,
    };

    render(<UsageLimitDisplay usage={proUsageData} isLoading={false} />);

    expect(screen.queryByText('Available Plans')).not.toBeInTheDocument();
  });

  it('calculates days until reset correctly', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);

    const usageWithFutureReset: UsageData = {
      ...mockUsageData,
      resetDate: futureDate.toISOString(),
    };

    render(<UsageLimitDisplay usage={usageWithFutureReset} isLoading={false} />);

    expect(screen.getByText('Resets in 15 days')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <UsageLimitDisplay 
        usage={mockUsageData} 
        isLoading={false} 
        className="custom-class" 
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows correct border styling based on usage level', () => {
    const { rerender, container } = render(
      <UsageLimitDisplay usage={mockUsageData} isLoading={false} />
    );

    // Normal usage - no special border
    expect(container.firstChild).not.toHaveClass('border-destructive', 'border-yellow-500');

    // Near limit
    const nearLimitUsage: UsageData = {
      ...mockUsageData,
      currentUsage: 8,
      remainingPosts: 2,
    };
    rerender(<UsageLimitDisplay usage={nearLimitUsage} isLoading={false} />);
    expect(container.firstChild).toHaveClass('border-yellow-500');

    // At limit
    const atLimitUsage: UsageData = {
      ...mockUsageData,
      currentUsage: 10,
      remainingPosts: 0,
    };
    rerender(<UsageLimitDisplay usage={atLimitUsage} isLoading={false} />);
    expect(container.firstChild).toHaveClass('border-destructive');
  });
});