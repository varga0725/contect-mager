import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PerformanceCharts } from '../PerformanceCharts';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockPerformanceData = {
  success: true,
  data: {
    timeSeries: [
      {
        date: '2024-01-01',
        platform: 'instagram',
        totalValue: 500,
        count: 3,
      },
      {
        date: '2024-01-02',
        platform: 'instagram',
        totalValue: 750,
        count: 2,
      },
      {
        date: '2024-01-01',
        platform: 'tiktok',
        totalValue: 300,
        count: 2,
      },
      {
        date: '2024-01-02',
        platform: 'tiktok',
        totalValue: 450,
        count: 1,
      },
    ],
    topPosts: [
      {
        postId: 1,
        platform: 'instagram',
        contentType: 'image',
        createdAt: '2024-01-01T10:00:00Z',
        totalValue: 1200,
      },
      {
        postId: 2,
        platform: 'tiktok',
        contentType: 'video',
        createdAt: '2024-01-01T15:00:00Z',
        totalValue: 800,
      },
      {
        postId: 3,
        platform: 'youtube',
        contentType: 'video',
        createdAt: '2024-01-02T09:00:00Z',
        totalValue: 600,
      },
    ],
    metricType: 'views',
  },
};

describe('PerformanceCharts', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPerformanceData),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<PerformanceCharts />);
    
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders performance data after loading', async () => {
    render(<PerformanceCharts />);

    await waitFor(() => {
      expect(screen.getByText('Views Over Time')).toBeInTheDocument();
    });

    expect(screen.getByText('Top Performing Posts')).toBeInTheDocument();
  });

  it('renders time series chart with data', async () => {
    render(<PerformanceCharts />);

    await waitFor(() => {
      expect(screen.getByText('Views Over Time')).toBeInTheDocument();
    });

    // Check for chart data points
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('750')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getByText('450')).toBeInTheDocument();

    // Check for formatted dates
    expect(screen.getByText('Jan 1')).toBeInTheDocument();
    expect(screen.getByText('Jan 2')).toBeInTheDocument();
  });

  it('renders platform legend', async () => {
    render(<PerformanceCharts />);

    await waitFor(() => {
      expect(screen.getByText('Views Over Time')).toBeInTheDocument();
    });

    expect(screen.getByText('instagram')).toBeInTheDocument();
    expect(screen.getByText('tiktok')).toBeInTheDocument();
  });

  it('renders top performing posts', async () => {
    render(<PerformanceCharts />);

    await waitFor(() => {
      expect(screen.getByText('Top Performing Posts')).toBeInTheDocument();
    });

    // Check for post rankings
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();

    // Check for post data
    expect(screen.getByText('1.2K views')).toBeInTheDocument();
    expect(screen.getByText('800 views')).toBeInTheDocument();
    expect(screen.getByText('600 views')).toBeInTheDocument();

    // Check for platforms and content types
    expect(screen.getAllByText('Instagram')).toHaveLength(1);
    expect(screen.getAllByText('Tiktok')).toHaveLength(1);
    expect(screen.getAllByText('Youtube')).toHaveLength(1);
    expect(screen.getAllByText('Image')).toHaveLength(1);
    expect(screen.getAllByText('Video')).toHaveLength(2);
  });

  it('handles metric type filter changes', async () => {
    render(<PerformanceCharts />);

    await waitFor(() => {
      expect(screen.getByText('Views Over Time')).toBeInTheDocument();
    });

    // Change metric type
    const metricSelect = screen.getByDisplayValue('Views');
    fireEvent.change(metricSelect, { target: { value: 'likes' } });

    // Apply filters
    const applyButton = screen.getByText('Apply Filters');
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('metricType=likes'),
        expect.any(Object)
      );
    });
  });

  it('handles platform filter changes', async () => {
    render(<PerformanceCharts />);

    await waitFor(() => {
      expect(screen.getByText('Views Over Time')).toBeInTheDocument();
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
    render(<PerformanceCharts />);

    await waitFor(() => {
      expect(screen.getByText('Views Over Time')).toBeInTheDocument();
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

  it('handles empty time series data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          timeSeries: [],
          topPosts: [],
          metricType: 'views',
        },
      }),
    });

    render(<PerformanceCharts />);

    await waitFor(() => {
      expect(screen.getByText('No time series data available')).toBeInTheDocument();
    });

    expect(screen.getByText('No top posts data available')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<PerformanceCharts />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch performance data/)).toBeInTheDocument();
    });

    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('formats numbers correctly in charts', async () => {
    const largeNumbersData = {
      ...mockPerformanceData,
      data: {
        ...mockPerformanceData.data,
        timeSeries: [
          {
            date: '2024-01-01',
            platform: 'instagram',
            totalValue: 1500000, // 1.5M
            count: 10,
          },
          {
            date: '2024-01-02',
            platform: 'instagram',
            totalValue: 125000, // 125K
            count: 5,
          },
        ],
        topPosts: [
          {
            postId: 1,
            platform: 'instagram',
            contentType: 'image',
            createdAt: '2024-01-01T10:00:00Z',
            totalValue: 2500000, // 2.5M
          },
        ],
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(largeNumbersData),
    });

    render(<PerformanceCharts />);

    await waitFor(() => {
      expect(screen.getByText('1.5M')).toBeInTheDocument();
    });

    expect(screen.getByText('125.0K')).toBeInTheDocument();
    expect(screen.getByText('2.5M views')).toBeInTheDocument();
  });

  it('updates chart title based on selected metric', async () => {
    render(<PerformanceCharts />);

    await waitFor(() => {
      expect(screen.getByText('Views Over Time')).toBeInTheDocument();
    });

    // Change to likes metric
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        ...mockPerformanceData,
        data: {
          ...mockPerformanceData.data,
          metricType: 'likes',
        },
      }),
    });

    const metricSelect = screen.getByDisplayValue('Views');
    fireEvent.change(metricSelect, { target: { value: 'likes' } });

    const applyButton = screen.getByText('Apply Filters');
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(screen.getByText('Likes Over Time')).toBeInTheDocument();
    });
  });

  it('formats dates correctly in top posts', async () => {
    render(<PerformanceCharts />);

    await waitFor(() => {
      expect(screen.getByText('Top Performing Posts')).toBeInTheDocument();
    });

    expect(screen.getByText('Created Jan 1')).toBeInTheDocument();
    expect(screen.getByText('Created Jan 2')).toBeInTheDocument();
  });
});