import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContentCard } from '../ContentCard';
import { GeneratedContent } from '../../../types';

const mockCaptionContent: GeneratedContent = {
  id: 1,
  userId: 1,
  platform: 'instagram',
  contentType: 'caption',
  contentData: {
    text: 'Beautiful sunset over the ocean 🌅',
    hashtags: ['#sunset', '#ocean', '#beautiful', '#nature', '#photography'],
  },
  metadata: {
    generationParams: {
      prompt: 'sunset over ocean',
      tone: 'inspiring',
    },
  },
  createdAt: new Date('2024-01-01'),
};

const mockImageContent: GeneratedContent = {
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
};

const mockVideoContent: GeneratedContent = {
  id: 3,
  userId: 1,
  platform: 'youtube',
  contentType: 'video',
  contentData: {
    videoUrl: 'https://example.com/video.mp4',
    description: 'City timelapse',
  },
  metadata: {
    generationParams: {
      prompt: 'city timelapse',
      duration: 30,
    },
  },
  scheduledAt: new Date('2024-02-01'),
  createdAt: new Date('2024-01-03'),
};

describe('ContentCard', () => {
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders caption content correctly', () => {
    render(<ContentCard content={mockCaptionContent} onDelete={mockOnDelete} />);

    expect(screen.getByText('instagram')).toBeInTheDocument();
    expect(screen.getByText('Beautiful sunset over the ocean 🌅')).toBeInTheDocument();
    expect(screen.getByText('#sunset')).toBeInTheDocument();
    expect(screen.getByText('#ocean')).toBeInTheDocument();
    expect(screen.getByText('#beautiful')).toBeInTheDocument();
    expect(screen.getByText('+2 more')).toBeInTheDocument(); // Shows only first 3 hashtags
    expect(screen.getByText('Created Jan 1, 2024')).toBeInTheDocument();
  });

  it('renders image content correctly', () => {
    render(<ContentCard content={mockImageContent} onDelete={mockOnDelete} />);

    expect(screen.getByText('tiktok')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Mountain landscape');
    expect(screen.getByText('Created Jan 2, 2024')).toBeInTheDocument();
  });

  it('renders video content correctly', () => {
    render(<ContentCard content={mockVideoContent} onDelete={mockOnDelete} />);

    expect(screen.getByText('youtube')).toBeInTheDocument();
    const videoElement = screen.getByText((content, element) => {
      return element?.tagName === 'VIDEO';
    });
    expect(videoElement).toHaveAttribute('src', 'https://example.com/video.mp4'); // video element
    expect(screen.getByText('Scheduled')).toBeInTheDocument();
    expect(screen.getByText('Created Jan 3, 2024')).toBeInTheDocument();
  });

  it('shows platform icons correctly', () => {
    const { rerender } = render(<ContentCard content={mockCaptionContent} onDelete={mockOnDelete} />);
    expect(screen.getByText('📷')).toBeInTheDocument(); // Instagram icon

    rerender(<ContentCard content={mockImageContent} onDelete={mockOnDelete} />);
    expect(screen.getByText('🎵')).toBeInTheDocument(); // TikTok icon

    rerender(<ContentCard content={mockVideoContent} onDelete={mockOnDelete} />);
    expect(screen.getByText('📺')).toBeInTheDocument(); // YouTube icon
  });

  it('shows content type icons correctly', () => {
    const { rerender } = render(<ContentCard content={mockCaptionContent} onDelete={mockOnDelete} />);
    expect(screen.getByText('📝')).toBeInTheDocument(); // Caption icon

    rerender(<ContentCard content={mockImageContent} onDelete={mockOnDelete} />);
    expect(screen.getByText('🖼️')).toBeInTheDocument(); // Image icon

    rerender(<ContentCard content={mockVideoContent} onDelete={mockOnDelete} />);
    expect(screen.getByText('🎬')).toBeInTheDocument(); // Video icon
  });

  it('handles delete confirmation flow', async () => {
    render(<ContentCard content={mockCaptionContent} onDelete={mockOnDelete} />);

    // Click delete button
    const deleteButton = screen.getByTitle('Delete content');
    fireEvent.click(deleteButton);

    // Check confirmation modal appears
    await waitFor(() => {
      expect(screen.getByText('Delete Content')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this content? This action cannot be undone.')).toBeInTheDocument();
    });

    // Cancel deletion
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Delete Content')).not.toBeInTheDocument();
    });

    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('confirms and executes deletion', async () => {
    mockOnDelete.mockResolvedValue(undefined);

    render(<ContentCard content={mockCaptionContent} onDelete={mockOnDelete} />);

    // Click delete button
    const deleteButton = screen.getByTitle('Delete content');
    fireEvent.click(deleteButton);

    // Confirm deletion
    await waitFor(() => {
      expect(screen.getByText('Delete Content')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Delete');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith(1);
    });
  });

  it('shows loading state during deletion', async () => {
    let resolveDelete: () => void;
    const deletePromise = new Promise<void>((resolve) => {
      resolveDelete = resolve;
    });
    mockOnDelete.mockReturnValue(deletePromise);

    render(<ContentCard content={mockCaptionContent} onDelete={mockOnDelete} />);

    // Click delete button and confirm
    const deleteButton = screen.getByTitle('Delete content');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Delete Content')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Delete');
    fireEvent.click(confirmButton);

    // Check loading state
    await waitFor(() => {
      expect(screen.getByText('Deleting...')).toBeInTheDocument();
    });

    // Resolve the promise
    resolveDelete!();

    await waitFor(() => {
      expect(screen.queryByText('Deleting...')).not.toBeInTheDocument();
    });
  });

  it('renders fallback for missing image', () => {
    const contentWithoutImage = {
      ...mockImageContent,
      contentData: {
        ...mockImageContent.contentData,
        imageUrl: undefined,
      },
    };

    const { container } = render(<ContentCard content={contentWithoutImage} onDelete={mockOnDelete} />);

    // Should show placeholder icon instead of image
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    // Check that the placeholder container is present
    const placeholderContainer = container.querySelector('.aspect-square.bg-gray-100');
    expect(placeholderContainer).toBeInTheDocument();
  });

  it('renders fallback for missing video', () => {
    const contentWithoutVideo = {
      ...mockVideoContent,
      contentData: {
        ...mockVideoContent.contentData,
        videoUrl: undefined,
      },
    };

    const { container } = render(<ContentCard content={contentWithoutVideo} onDelete={mockOnDelete} />);

    // Should show placeholder icon instead of video
    expect(screen.queryByRole('application')).not.toBeInTheDocument();
    // Check that the placeholder container is present
    const placeholderContainer = container.querySelector('.aspect-video.bg-gray-100');
    expect(placeholderContainer).toBeInTheDocument();
  });

  it('handles caption without hashtags', () => {
    const contentWithoutHashtags = {
      ...mockCaptionContent,
      contentData: {
        text: 'Simple caption without hashtags',
      },
    };

    render(<ContentCard content={contentWithoutHashtags} onDelete={mockOnDelete} />);

    expect(screen.getByText('Simple caption without hashtags')).toBeInTheDocument();
    expect(screen.queryByText('#')).not.toBeInTheDocument();
  });

  it('truncates long captions', () => {
    const longCaptionContent = {
      ...mockCaptionContent,
      contentData: {
        text: 'This is a very long caption that should be truncated when displayed in the card view because it exceeds the reasonable length for a preview. It should show only the first few lines and then cut off with CSS line-clamp.',
      },
    };

    render(<ContentCard content={longCaptionContent} onDelete={mockOnDelete} />);

    // The text should be present but truncated via CSS
    expect(screen.getByText(/This is a very long caption/)).toBeInTheDocument();
  });
});