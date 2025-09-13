import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnalyticsDashboard } from '../AnalyticsDashboard';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockAnalyticsData = {
  success: true,
  data: {
    overview: {
      totalPosts: 25,
      metrics: {
        views: { total: 15000, count: 25 },
        likes: { total: 1200, count: 25 },
        shares: { total: 150, count: 15 },
        comments: { total: 300, count: 20 },
      },
    },
    platformBreakdown: [
      {
        platform: 'instagram',
        count: 10,
        totalViews: 8000,
        totalLikes: 600,
      },
      {
        platform: 'tiktok',
        count: 8,
        totalViews: 5000,
        totalLikes: 400,
      },
      {
        platform: 'youtube',
        count: 7,
        totalViews: 2000,
        totalLikes: 200,
      },
    ],
  },
};

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalyticsData),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<AnalyticsDashboard />);
    
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    // Check for loading skeleton
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(4);
  });

  it('renders analytics data after loading', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument(); // Total posts
    });

    expect(screen.getByText('15.0K')).toBeInTheDocument(); // Total views
    expect(screen.getByText('1.2K')).toBeInTheDocument(); // Total likes
    expect(screen.getByText('8.0%')).toBeInTheDocument(); // Engagement rate
  });

  it('renders platform breakdown', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Instagram')).toBeInTheDocument();
    });

    expect(screen.getByText('Tiktok')).toBeInTheDocument();
    expect(screen.getByText('Youtube')).toBeInTheDocument();
    
    // Check post counts
    expect(screen.getByText('10 posts')).toBeInTheDocument();
    expect(screen.getByText('8 posts')).toBeInTheDocument();
    expect(screen.getByText('7 posts')).toBeInTheDocument();
  });

  it('handles filter changes', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    // Change platform filter
    const platformSelect = screen.getByDisplayValue('All Platforms');
    fireEvent.change(platformSelect, { target: { value: 'instagram' } });

    // Apply filters
    const applyButton = screen.getByText('Apply Filters');
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('platform=instagram'),
        expect.any(Object)
      );
    });
  });

  it('handles date range filters', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    // Set date filters
    const startDateInput = screen.getByLabelText('Start Date');
    const endDateInput = screen.getByLabelText('End Date');
    
    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-31' } });

    // Apply filters
    const applyButton = screen.getByText('Apply Filters');
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('startDate=2024-01-01'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('endDate=2024-01-31'),
        expect.any(Object)
      );
    });
  });

  it('resets filters correctly', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    // Set some filters
    const platformSelect = screen.getByDisplayValue('All Platforms');
    fireEvent.change(platformSelect, { target: { value: 'instagram' } });

    // Reset filters
    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);

    expect(platformSelect).toHaveValue('');
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch analytics data/)).toBeInTheDocument();
    });

    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('handles empty data state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          overview: { totalPosts: 0, metrics: {} },
          platformBreakdown: [],
        },
      }),
    });

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument(); // Total posts
    });

    expect(screen.getByText('No platform data available')).toBeInTheDocument();
  });

  it('refreshes data when refresh button is clicked', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh Data');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2); // Initial load + refresh
    });
  });

  it('formats large numbers correctly', async () => {
    const largeNumbersData = {
      ...mockAnalyticsData,
      data: {
        ...mockAnalyticsData.data,
        overview: {
          totalPosts: 1000,
          metrics: {
            views: { total: 1500000, count: 1000 }, // 1.5M
            likes: { total: 125000, count: 1000 }, // 125K
            shares: { total: 5000, count: 500 },
            comments: { total: 15000, count: 800 },
          },
        },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(largeNumbersData),
    });

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('1.5M')).toBeInTheDocument(); // Views
    });

    expect(screen.getByText('125.0K')).toBeInTheDocument(); // Likes
  });

  it('calculates engagement rate correctly', async () => {
    const customData = {
      ...mockAnalyticsData,
      data: {
        ...mockAnalyticsData.data,
        overview: {
          totalPosts: 10,
          metrics: {
            views: { total: 1000, count: 10 },
            likes: { total: 100, count: 10 }, // 10% engagement rate
            shares: { total: 20, count: 5 },
            comments: { total: 50, count: 8 },
          },
        },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(customData),
    });

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('10.0%')).toBeInTheDocument(); // Engagement rate
    });
  });
});