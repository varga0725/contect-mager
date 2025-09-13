import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarView } from '../CalendarView';
import type { GeneratedContent } from '../../../types';

const mockScheduledContent: GeneratedContent[] = [
  {
    id: 1,
    userId: 1,
    platform: 'instagram',
    contentType: 'caption',
    contentData: { text: 'Test caption for Instagram' },
    metadata: {},
    scheduledAt: new Date('2024-12-15T10:00:00Z'),
    createdAt: new Date('2024-12-01T10:00:00Z'),
  },
  {
    id: 2,
    userId: 1,
    platform: 'tiktok',
    contentType: 'video',
    contentData: { videoUrl: 'https://example.com/video.mp4' },
    metadata: {},
    scheduledAt: new Date('2024-12-15T14:00:00Z'),
    createdAt: new Date('2024-12-01T11:00:00Z'),
  },
];

const defaultProps = {
  scheduledContent: mockScheduledContent,
  onDateSelect: vi.fn(),
  onEventClick: vi.fn(),
  onScheduleContent: vi.fn(),
};

describe('CalendarView', () => {
  it('renders calendar with month and year', () => {
    render(<CalendarView {...defaultProps} />);
    
    // Should show current month and year in header
    expect(screen.getByText(/December 2024/)).toBeInTheDocument();
  });

  it('renders day headers', () => {
    render(<CalendarView {...defaultProps} />);
    
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });

  it('displays scheduled content on correct dates', () => {
    render(<CalendarView {...defaultProps} />);
    
    // Should show content on December 15th
    expect(screen.getByText('Test caption for Inst...')).toBeInTheDocument();
  });

  it('calls onDateSelect when date is clicked', () => {
    const onDateSelect = vi.fn();
    render(<CalendarView {...defaultProps} onDateSelect={onDateSelect} />);
    
    // Click on a date (assuming December 15th is visible)
    const dateCell = screen.getByText('15').closest('div');
    if (dateCell) {
      fireEvent.click(dateCell);
      expect(onDateSelect).toHaveBeenCalledWith(expect.any(Date));
    }
  });

  it('calls onEventClick when scheduled content is clicked', () => {
    const onEventClick = vi.fn();
    render(<CalendarView {...defaultProps} onEventClick={onEventClick} />);
    
    // Click on scheduled content
    const contentElement = screen.getByText('Test caption for Inst...');
    fireEvent.click(contentElement);
    
    expect(onEventClick).toHaveBeenCalledWith(mockScheduledContent[0]);
  });

  it('navigates between months', () => {
    render(<CalendarView {...defaultProps} />);
    
    // Click next month button
    const nextButton = screen.getByRole('button', { name: /chevron-right/i });
    fireEvent.click(nextButton);
    
    // Should show next month
    expect(screen.getByText(/January 2025/)).toBeInTheDocument();
    
    // Click previous month button
    const prevButton = screen.getByRole('button', { name: /chevron-left/i });
    fireEvent.click(prevButton);
    
    // Should go back to December
    expect(screen.getByText(/December 2024/)).toBeInTheDocument();
  });

  it('highlights selected date', () => {
    const selectedDate = new Date('2024-12-15');
    render(<CalendarView {...defaultProps} selectedDate={selectedDate} />);
    
    const selectedDateCell = screen.getByText('15').closest('div');
    expect(selectedDateCell).toHaveClass('bg-blue-50');
  });

  it('shows platform colors for scheduled content', () => {
    render(<CalendarView {...defaultProps} />);
    
    // Instagram content should have pink background
    const instagramContent = screen.getByText('Test caption for Inst...');
    expect(instagramContent).toHaveClass('bg-pink-500');
  });

  it('shows "more" indicator when there are many items on one date', () => {
    const manyItemsContent = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      userId: 1,
      platform: 'instagram' as const,
      contentType: 'caption' as const,
      contentData: { text: `Test caption ${i + 1}` },
      metadata: {},
      scheduledAt: new Date('2024-12-15T10:00:00Z'),
      createdAt: new Date('2024-12-01T10:00:00Z'),
    }));

    render(<CalendarView {...defaultProps} scheduledContent={manyItemsContent} />);
    
    // Should show "+2 more" since we only show first 3 items
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('disables past dates for scheduling', () => {
    render(<CalendarView {...defaultProps} />);
    
    // Past dates should have opacity-60 class
    const pastDateCells = screen.getAllByText(/^[1-9]$|^[12][0-9]$|^3[01]$/);
    const today = new Date();
    
    pastDateCells.forEach(cell => {
      const dayNumber = parseInt(cell.textContent || '0');
      if (dayNumber < today.getDate()) {
        expect(cell.closest('div')).toHaveClass('opacity-60');
      }
    });
  });

  it('renders platform legend', () => {
    render(<CalendarView {...defaultProps} />);
    
    // Should show platform legend
    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText('Tiktok')).toBeInTheDocument();
    expect(screen.getByText('Youtube')).toBeInTheDocument();
    expect(screen.getByText('Linkedin')).toBeInTheDocument();
    expect(screen.getByText('Twitter')).toBeInTheDocument();
  });
});