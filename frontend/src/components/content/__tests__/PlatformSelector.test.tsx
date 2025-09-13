import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { PlatformSelector } from '../PlatformSelector';
import type { Platform } from '../../../types';

describe('PlatformSelector', () => {
  const mockOnPlatformChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all platform options', () => {
    render(
      <PlatformSelector
        selectedPlatform="instagram"
        onPlatformChange={mockOnPlatformChange}
      />
    );

    expect(screen.getByText('Select Platform')).toBeInTheDocument();
    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText('TikTok')).toBeInTheDocument();
    expect(screen.getByText('YouTube')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('X (Twitter)')).toBeInTheDocument();
  });

  it('highlights the selected platform', () => {
    render(
      <PlatformSelector
        selectedPlatform="tiktok"
        onPlatformChange={mockOnPlatformChange}
      />
    );

    const tiktokButton = screen.getByText('TikTok').closest('button');
    expect(tiktokButton).toHaveClass('ring-2', 'ring-primary', 'ring-offset-2');
  });

  it('calls onPlatformChange when a platform is selected', () => {
    render(
      <PlatformSelector
        selectedPlatform="instagram"
        onPlatformChange={mockOnPlatformChange}
      />
    );

    const youtubeButton = screen.getByText('YouTube');
    fireEvent.click(youtubeButton);

    expect(mockOnPlatformChange).toHaveBeenCalledWith('youtube');
  });

  it('displays platform-specific information for Instagram', () => {
    render(
      <PlatformSelector
        selectedPlatform="instagram"
        onPlatformChange={mockOnPlatformChange}
      />
    );

    expect(screen.getByText(/instagram.*Specifications/i)).toBeInTheDocument();
    expect(screen.getByText(/Up to 2,200 characters/)).toBeInTheDocument();
    expect(screen.getByText(/Square \(1080x1080\) or vertical/)).toBeInTheDocument();
    expect(screen.getByText(/Up to 60 seconds, vertical format/)).toBeInTheDocument();
    expect(screen.getByText(/Up to 30 hashtags/)).toBeInTheDocument();
  });

  it('displays platform-specific information for TikTok', () => {
    render(
      <PlatformSelector
        selectedPlatform="tiktok"
        onPlatformChange={mockOnPlatformChange}
      />
    );

    expect(screen.getByText(/tiktok.*Specifications/i)).toBeInTheDocument();
    expect(screen.getByText(/Up to 4,000 characters/)).toBeInTheDocument();
    expect(screen.getByText(/Vertical \(1080x1920\)/)).toBeInTheDocument();
    expect(screen.getByText(/Up to 3 minutes, vertical format/)).toBeInTheDocument();
  });

  it('displays platform-specific information for YouTube', () => {
    render(
      <PlatformSelector
        selectedPlatform="youtube"
        onPlatformChange={mockOnPlatformChange}
      />
    );

    expect(screen.getByText(/youtube.*Specifications/i)).toBeInTheDocument();
    expect(screen.getByText(/Up to 5,000 characters/)).toBeInTheDocument();
    expect(screen.getByText(/Horizontal \(1280x720\) or square/)).toBeInTheDocument();
    expect(screen.getByText(/Up to 60 seconds for Shorts/)).toBeInTheDocument();
  });

  it('displays platform-specific information for LinkedIn', () => {
    render(
      <PlatformSelector
        selectedPlatform="linkedin"
        onPlatformChange={mockOnPlatformChange}
      />
    );

    expect(screen.getByText(/linkedin.*Specifications/i)).toBeInTheDocument();
    expect(screen.getByText(/Up to 3,000 characters/)).toBeInTheDocument();
    expect(screen.getByText(/Horizontal \(1200x627\) recommended/)).toBeInTheDocument();
    expect(screen.getByText(/Up to 10 minutes, horizontal format/)).toBeInTheDocument();
  });

  it('displays platform-specific information for Twitter', () => {
    render(
      <PlatformSelector
        selectedPlatform="twitter"
        onPlatformChange={mockOnPlatformChange}
      />
    );

    expect(screen.getByText(/twitter.*Specifications/i)).toBeInTheDocument();
    expect(screen.getByText(/Up to 280 characters/)).toBeInTheDocument();
    expect(screen.getByText(/Horizontal \(1200x675\) or square/)).toBeInTheDocument();
    expect(screen.getByText(/Up to 2 minutes 20 seconds/)).toBeInTheDocument();
  });

  it('updates platform information when selection changes', () => {
    const { rerender } = render(
      <PlatformSelector
        selectedPlatform="instagram"
        onPlatformChange={mockOnPlatformChange}
      />
    );

    expect(screen.getByText(/instagram.*Specifications/i)).toBeInTheDocument();

    rerender(
      <PlatformSelector
        selectedPlatform="tiktok"
        onPlatformChange={mockOnPlatformChange}
      />
    );

    expect(screen.getByText(/tiktok.*Specifications/i)).toBeInTheDocument();
    expect(screen.queryByText(/instagram.*Specifications/i)).not.toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <PlatformSelector
        selectedPlatform="instagram"
        onPlatformChange={mockOnPlatformChange}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows platform icons', () => {
    render(
      <PlatformSelector
        selectedPlatform="instagram"
        onPlatformChange={mockOnPlatformChange}
      />
    );

    // Check for emoji icons (they should be present as text content)
    expect(screen.getByText('📷')).toBeInTheDocument(); // Instagram
    expect(screen.getByText('🎵')).toBeInTheDocument(); // TikTok
    expect(screen.getByText('📺')).toBeInTheDocument(); // YouTube
    expect(screen.getByText('💼')).toBeInTheDocument(); // LinkedIn
    expect(screen.getByText('🐦')).toBeInTheDocument(); // Twitter
  });
});