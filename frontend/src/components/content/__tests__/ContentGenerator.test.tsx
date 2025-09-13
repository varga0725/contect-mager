import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ContentGenerator } from '../ContentGenerator';
import { contentApi } from '../../../lib/api';

// Mock the API
vi.mock('../../../lib/api', () => ({
  contentApi: {
    getUsage: vi.fn(),
    generateCaption: vi.fn(),
    generateImage: vi.fn(),
    generateVideo: vi.fn(),
  },
}));

const mockUsageData = {
  success: true,
  data: {
    currentUsage: 5,
    monthlyLimit: 10,
    tier: 'free' as const,
    resetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    remainingPosts: 5,
  },
};

const mockCaptionResponse = {
  success: true,
  data: {
    id: 1,
    caption: 'Test caption for Instagram',
    hashtags: ['#test', '#instagram', '#content'],
    platform: 'instagram',
    contentType: 'caption',
    createdAt: new Date().toISOString(),
  },
};

const mockImageResponse = {
  success: true,
  data: {
    id: 2,
    imageUrl: 'https://example.com/test-image.jpg',
    description: 'Test image',
    platform: 'instagram',
    contentType: 'image',
    dimensions: { width: 1080, height: 1080 },
    createdAt: new Date().toISOString(),
  },
};

const mockVideoResponse = {
  success: true,
  data: {
    id: 3,
    videoUrl: 'https://example.com/test-video.mp4',
    description: 'Test video',
    platform: 'instagram',
    contentType: 'video',
    duration: 30,
    aspectRatio: '9:16',
    createdAt: new Date().toISOString(),
  },
};

function renderWithQueryClient(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
}

describe('ContentGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (contentApi.getUsage as any).mockResolvedValue(mockUsageData);
  });

  it('renders the content generator interface', async () => {
    renderWithQueryClient(<ContentGenerator />);

    expect(screen.getByText('Generate AI Content')).toBeInTheDocument();
    expect(screen.getByText('Create engaging content for your social media platforms using AI')).toBeInTheDocument();
    
    // Should show platform selector
    expect(screen.getByText('Select Platform')).toBeInTheDocument();
    expect(screen.getByText('Instagram')).toBeInTheDocument();
    
    // Should show content type selector
    expect(screen.getByText('Content Type')).toBeInTheDocument();
    const captionButtons = screen.getAllByRole('button', { name: /caption/i });
    expect(captionButtons.length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /image/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /video/i })).toBeInTheDocument();
  });

  it('displays usage statistics', async () => {
    renderWithQueryClient(<ContentGenerator />);

    await waitFor(() => {
      expect(screen.getByText('Monthly Usage - Free Plan')).toBeInTheDocument();
      expect(screen.getByText('5 of 10 posts used')).toBeInTheDocument();
      expect(screen.getByText('5 posts remaining')).toBeInTheDocument();
    });
  });

  it('allows platform selection', async () => {
    renderWithQueryClient(<ContentGenerator />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Generate AI Content')).toBeInTheDocument();
    });

    const tiktokButton = screen.getByText('TikTok');
    fireEvent.click(tiktokButton);

    // Should show TikTok-specific information
    await waitFor(() => {
      expect(screen.getByText('tiktok Specifications')).toBeInTheDocument();
    });
  });

  it('allows content type selection', async () => {
    renderWithQueryClient(<ContentGenerator />);

    const imageButton = screen.getByRole('button', { name: /image/i });
    fireEvent.click(imageButton);

    // Should show image-specific form fields
    await waitFor(() => {
      expect(screen.getByLabelText('Style')).toBeInTheDocument();
      expect(screen.getByLabelText('Aspect Ratio')).toBeInTheDocument();
    });
  });

  it('generates caption content successfully', async () => {
    (contentApi.generateCaption as any).mockResolvedValue(mockCaptionResponse);
    
    renderWithQueryClient(<ContentGenerator />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Generate AI Content')).toBeInTheDocument();
    });

    // Fill in the prompt
    const promptTextarea = screen.getByLabelText(/Content Prompt/i);
    fireEvent.change(promptTextarea, { 
      target: { value: 'Create a motivational post about fitness' } 
    });

    // Submit the form
    const generateButton = screen.getByRole('button', { name: /Generate Caption/i });
    fireEvent.click(generateButton);

    // Should show loading state
    expect(screen.getByText(/Generating caption.../i)).toBeInTheDocument();

    // Wait for generation to complete
    await waitFor(() => {
      expect(screen.getByText('Test caption for Instagram')).toBeInTheDocument();
      expect(screen.getByText('#test')).toBeInTheDocument();
      expect(screen.getByText('#instagram')).toBeInTheDocument();
      expect(screen.getByText('#content')).toBeInTheDocument();
    });

    // Should show preview actions
    expect(screen.getByRole('button', { name: /Generate New Content/i })).toBeInTheDocument();
  });

  it('generates image content successfully', async () => {
    (contentApi.generateImage as any).mockResolvedValue(mockImageResponse);
    
    renderWithQueryClient(<ContentGenerator />);

    // Switch to image content type
    const imageButton = screen.getByRole('button', { name: /image/i });
    fireEvent.click(imageButton);

    // Wait for form to update
    await waitFor(() => {
      expect(screen.getByLabelText('Style')).toBeInTheDocument();
    });

    // Fill in the prompt
    const promptTextarea = screen.getByLabelText(/Content Prompt/i);
    fireEvent.change(promptTextarea, { 
      target: { value: 'A beautiful sunset over mountains' } 
    });

    // Submit the form
    const generateButton = screen.getByRole('button', { name: /Generate Image/i });
    fireEvent.click(generateButton);

    // Wait for generation to complete
    await waitFor(() => {
      const image = screen.getByAltText('Generated content');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/test-image.jpg');
    });
  });

  it('generates video content successfully', async () => {
    (contentApi.generateVideo as any).mockResolvedValue(mockVideoResponse);
    
    renderWithQueryClient(<ContentGenerator />);

    // Switch to video content type
    const videoButton = screen.getByRole('button', { name: /video/i });
    fireEvent.click(videoButton);

    // Wait for form to update
    await waitFor(() => {
      expect(screen.getByLabelText('Duration (seconds)')).toBeInTheDocument();
    });

    // Fill in the prompt
    const promptTextarea = screen.getByLabelText(/Content Prompt/i);
    fireEvent.change(promptTextarea, { 
      target: { value: 'A time-lapse of a flower blooming' } 
    });

    // Submit the form
    const generateButton = screen.getByRole('button', { name: /Generate Video/i });
    fireEvent.click(generateButton);

    // Wait for generation to complete
    await waitFor(() => {
      const video = screen.getByTestId('generated-video'); // Use test id instead
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('src', 'https://example.com/test-video.mp4');
    });
  });

  it('shows upgrade prompt when at usage limit', async () => {
    const limitReachedUsage = {
      ...mockUsageData,
      data: {
        ...mockUsageData.data,
        currentUsage: 10,
        remainingPosts: 0,
      },
    };
    
    (contentApi.getUsage as any).mockResolvedValue(limitReachedUsage);
    
    renderWithQueryClient(<ContentGenerator />);

    await waitFor(() => {
      expect(screen.getByText('Monthly Limit Reached')).toBeInTheDocument();
      expect(screen.getByText(/You've reached your monthly content generation limit/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Upgrade Subscription/i })).toBeInTheDocument();
    });
  });

  it('disables generation when form is invalid', async () => {
    renderWithQueryClient(<ContentGenerator />);

    await waitFor(() => {
      const generateButton = screen.getByRole('button', { name: /Generate Caption/i });
      expect(generateButton).toBeDisabled();
    });
  });

  it('handles generation errors gracefully', async () => {
    (contentApi.generateCaption as any).mockRejectedValue(new Error('Generation failed'));
    
    renderWithQueryClient(<ContentGenerator />);

    // Fill in the prompt
    const promptTextarea = screen.getByLabelText(/Content Prompt/i);
    fireEvent.change(promptTextarea, { 
      target: { value: 'Test prompt' } 
    });

    // Submit the form
    const generateButton = screen.getByRole('button', { name: /Generate Caption/i });
    fireEvent.click(generateButton);

    // Should handle error and return to form state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Generate Caption/i })).not.toBeDisabled();
    });
  });

  it('allows starting new generation after successful generation', async () => {
    (contentApi.generateCaption as any).mockResolvedValue(mockCaptionResponse);
    
    renderWithQueryClient(<ContentGenerator />);

    // Generate content first
    const promptTextarea = screen.getByLabelText(/Content Prompt/i);
    fireEvent.change(promptTextarea, { 
      target: { value: 'Test prompt' } 
    });

    const generateButton = screen.getByRole('button', { name: /Generate Caption/i });
    fireEvent.click(generateButton);

    // Wait for generation to complete
    await waitFor(() => {
      expect(screen.getByText('Test caption for Instagram')).toBeInTheDocument();
    });

    // Click "Generate New Content"
    const newContentButton = screen.getByRole('button', { name: /Generate New Content/i });
    fireEvent.click(newContentButton);

    // Should return to form view
    await waitFor(() => {
      expect(screen.getByLabelText(/Content Prompt/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Generate Caption/i })).toBeInTheDocument();
    });
  });

  it('shows platform-specific optimization tips', async () => {
    (contentApi.generateCaption as any).mockResolvedValue(mockCaptionResponse);
    
    renderWithQueryClient(<ContentGenerator />);

    // Generate content
    const promptTextarea = screen.getByLabelText(/Content Prompt/i);
    fireEvent.change(promptTextarea, { 
      target: { value: 'Test prompt' } 
    });

    const generateButton = screen.getByRole('button', { name: /Generate Caption/i });
    fireEvent.click(generateButton);

    // Wait for generation and check for optimization tips
    await waitFor(() => {
      expect(screen.getByText('Platform Optimization Tips')).toBeInTheDocument();
    });
  });
});