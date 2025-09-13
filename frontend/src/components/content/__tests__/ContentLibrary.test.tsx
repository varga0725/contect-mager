import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ContentLibrary } from '../ContentLibrary';
import { contentApi } from '../../../lib/api';
import { GeneratedContent } from '../../../types';

// Mock the API
vi.mock('../../../lib/api', () => ({
  contentApi: {
    getLibrary: vi.fn(),
    deleteContent: vi.fn(),
  },
}));

const mockContent: GeneratedContent[] = [
  {
    id: 1,
    userId: 1,
    platform: 'instagram',
    contentType: 'caption',
    contentData: {
      text: 'Beautiful sunset over the ocean 🌅',
      hashtags: ['#sunset', '#ocean', '#beautiful'],
    },
    metadata: {
      generationParams: {
        prompt: 'sunset over ocean',
        tone: 'inspiring',
      },
    },
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 2,
    userId: 1,
    platform: 'tiktok',
    contentType: 'image',
    contentData: {
      imageUrl: 'https://example.com/image.jpg',
      description: 'Mountain landscape',
    },
    metadata: {
      generationParams: {
        prompt: 'mountain landscape',
        style: 'photorealistic',
      },
    },
    createdAt: new Date('2024-01-02'),
  },
];

const mockApiResponse = {
  success: true,
  data: {
    content: mockContent,
    pagination: {
      page: 1,
      limit: 12,
      total: 2,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
    filters: {
      platform: null,
      contentType: null,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
  },
};

describe('ContentLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(contentApi.getLibrary).mockResolvedValue(mockApiResponse);
  });

  it('renders loading state initially', () => {
    render(<ContentLibrary />);
    expect(screen.getByText('Loading your content library...')).toBeInTheDocument();
  });

  it('renders content library with items', async () => {
    render(<ContentLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Content Library')).toBeInTheDocument();
      expect(screen.getByText('2 items total')).toBeInTheDocument();
    });

    // Check that content items are rendered
    expect(screen.getByText('Beautiful sunset over the ocean 🌅')).toBeInTheDocument();
    expect(screen.getByText('instagram')).toBeInTheDocument();
    expect(screen.getByText('tiktok')).toBeInTheDocument();
  });

  it('renders empty state when no content', async () => {
    vi.mocked(contentApi.getLibrary).mockResolvedValue({
      ...mockApiResponse,
      data: {
        ...mockApiResponse.data,
        content: [],
        pagination: {
          ...mockApiResponse.data.pagination,
          total: 0,
        },
      },
    });

    render(<ContentLibrary />);

    await waitFor(() => {
      expect(screen.getByText('No content found')).toBeInTheDocument();
      expect(screen.getByText('Start creating content to see it appear here.')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(contentApi.getLibrary).mockRejectedValue(new Error('API Error'));

    render(<ContentLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Content')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });

    // Test retry functionality
    const retryButton = screen.getByText('Try Again');
    vi.mocked(contentApi.getLibrary).mockResolvedValue(mockApiResponse);
    
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Content Library')).toBeInTheDocument();
    });
  });

  it('filters content by platform', async () => {
    render(<ContentLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Content Library')).toBeInTheDocument();
    });

    // Find and click platform filter
    const platformSelect = screen.getByDisplayValue('All Platforms');
    fireEvent.change(platformSelect, { target: { value: 'instagram' } });

    await waitFor(() => {
      expect(contentApi.getLibrary).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: 'instagram',
        })
      );
    });
  });

  it('filters content by content type', async () => {
    render(<ContentLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Content Library')).toBeInTheDocument();
    });

    // Find and click content type filter
    const contentTypeSelect = screen.getByDisplayValue('All Types');
    fireEvent.change(contentTypeSelect, { target: { value: 'caption' } });

    await waitFor(() => {
      expect(contentApi.getLibrary).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'caption',
        })
      );
    });
  });

  it('changes sort order', async () => {
    render(<ContentLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Content Library')).toBeInTheDocument();
    });

    // Find and click sort order button
    const sortButton = screen.getByTitle('Sort ascending');
    fireEvent.click(sortButton);

    await waitFor(() => {
      expect(contentApi.getLibrary).toHaveBeenCalledWith(
        expect.objectContaining({
          sortOrder: 'asc',
        })
      );
    });
  });

  it('handles pagination', async () => {
    const paginatedResponse = {
      ...mockApiResponse,
      data: {
        ...mockApiResponse.data,
        content: [mockContent[0]], // Only show first item
        pagination: {
          page: 1,
          limit: 1,
          total: 2,
          totalPages: 2,
          hasNextPage: true,
          hasPrevPage: false,
        },
      },
    };

    vi.mocked(contentApi.getLibrary).mockResolvedValue(paginatedResponse);

    render(<ContentLibrary />);

    await waitFor(() => {
      expect(screen.getByLabelText('Pagination')).toBeInTheDocument();
    });

    // Click next page (page number 2) - get the button specifically
    const pageButtons = screen.getAllByText('2');
    const pageButton = pageButtons.find(button => button.tagName === 'BUTTON');
    expect(pageButton).toBeInTheDocument();
    fireEvent.click(pageButton!);

    await waitFor(() => {
      expect(contentApi.getLibrary).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        })
      );
    });
  });

  it('deletes content successfully', async () => {
    vi.mocked(contentApi.deleteContent).mockResolvedValue({
      success: true,
      data: { message: 'Content deleted successfully', deletedId: 1 },
    });

    render(<ContentLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Content Library')).toBeInTheDocument();
    });

    // Find and click delete button
    const deleteButtons = screen.getAllByTitle('Delete content');
    fireEvent.click(deleteButtons[0]);

    // Confirm deletion
    await waitFor(() => {
      expect(screen.getByText('Delete Content')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Delete');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(contentApi.deleteContent).toHaveBeenCalledWith(1);
      // Should refetch content after deletion
      expect(contentApi.getLibrary).toHaveBeenCalledTimes(2);
    });
  });

  it('clears filters when clear button is clicked', async () => {
    // Set up initial state with filters
    const filteredResponse = {
      ...mockApiResponse,
      data: {
        ...mockApiResponse.data,
        filters: {
          platform: 'instagram',
          contentType: 'caption',
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      },
    };

    vi.mocked(contentApi.getLibrary).mockResolvedValue(filteredResponse);

    render(<ContentLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Content Library')).toBeInTheDocument();
    });

    // Apply filters first
    const platformSelect = screen.getByDisplayValue('All Platforms');
    fireEvent.change(platformSelect, { target: { value: 'instagram' } });

    await waitFor(() => {
      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });

    // Clear filters
    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(contentApi.getLibrary).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: undefined,
          contentType: undefined,
        })
      );
    });
  });
});