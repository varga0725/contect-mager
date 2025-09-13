import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SchedulingModal } from '../SchedulingModal';
import type { GeneratedContent } from '../../../types';

const mockContent: GeneratedContent = {
  id: 1,
  userId: 1,
  platform: 'instagram',
  contentType: 'caption',
  contentData: { text: 'Test caption for scheduling' },
  metadata: {},
  createdAt: new Date('2024-12-01T10:00:00Z'),
};

const mockScheduledContent: GeneratedContent = {
  ...mockContent,
  scheduledAt: new Date('2024-12-15T10:00:00Z'),
};

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  content: mockContent,
  onSchedule: vi.fn(),
  onUnschedule: vi.fn(),
};

describe('SchedulingModal', () => {
  it('renders when open with content', () => {
    render(<SchedulingModal {...defaultProps} />);
    
    expect(screen.getByText('Schedule Content')).toBeInTheDocument();
    expect(screen.getByText('Test caption for scheduling')).toBeInTheDocument();
    expect(screen.getByText('instagram')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<SchedulingModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Schedule Content')).not.toBeInTheDocument();
  });

  it('does not render when no content provided', () => {
    render(<SchedulingModal {...defaultProps} content={null} />);
    
    expect(screen.queryByText('Schedule Content')).not.toBeInTheDocument();
  });

  it('shows current schedule status for scheduled content', () => {
    render(<SchedulingModal {...defaultProps} content={mockScheduledContent} />);
    
    expect(screen.getByText('Currently Scheduled')).toBeInTheDocument();
    expect(screen.getByText(/Sunday, December 15, 2024/)).toBeInTheDocument();
  });

  it('pre-fills date and time inputs', () => {
    const selectedDate = new Date('2024-12-20');
    render(<SchedulingModal {...defaultProps} selectedDate={selectedDate} />);
    
    const dateInput = screen.getByLabelText('Date') as HTMLInputElement;
    const timeInput = screen.getByLabelText('Time') as HTMLInputElement;
    
    expect(dateInput.value).toBe('2024-12-20');
    expect(timeInput.value).toBe('09:00');
  });

  it('calls onSchedule with correct parameters', async () => {
    const onSchedule = vi.fn().mockResolvedValue(undefined);
    render(<SchedulingModal {...defaultProps} onSchedule={onSchedule} />);
    
    // Set future date and time
    const dateInput = screen.getByLabelText('Date');
    const timeInput = screen.getByLabelText('Time');
    
    fireEvent.change(dateInput, { target: { value: '2024-12-25' } });
    fireEvent.change(timeInput, { target: { value: '14:30' } });
    
    // Click schedule button
    const scheduleButton = screen.getByText('Schedule');
    fireEvent.click(scheduleButton);
    
    await waitFor(() => {
      expect(onSchedule).toHaveBeenCalledWith(1, '2024-12-25T14:30:00.000Z');
    });
  });

  it('calls onUnschedule for scheduled content', async () => {
    const onUnschedule = vi.fn().mockResolvedValue(undefined);
    render(<SchedulingModal {...defaultProps} content={mockScheduledContent} onUnschedule={onUnschedule} />);
    
    const unscheduleButton = screen.getByText('Unschedule');
    fireEvent.click(unscheduleButton);
    
    await waitFor(() => {
      expect(onUnschedule).toHaveBeenCalledWith(1);
    });
  });

  it('prevents scheduling past dates', async () => {
    // Mock alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<SchedulingModal {...defaultProps} />);
    
    // Set past date
    const dateInput = screen.getByLabelText('Date');
    const timeInput = screen.getByLabelText('Time');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    fireEvent.change(dateInput, { target: { value: yesterday.toISOString().split('T')[0] } });
    fireEvent.change(timeInput, { target: { value: '10:00' } });
    
    const scheduleButton = screen.getByText('Schedule');
    fireEvent.click(scheduleButton);
    
    expect(alertSpy).toHaveBeenCalledWith('Please select a future date and time');
    
    alertSpy.mockRestore();
  });

  it('shows loading state', () => {
    render(<SchedulingModal {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText('Scheduling...')).toBeInTheDocument();
    
    const scheduleButton = screen.getByText('Scheduling...');
    expect(scheduleButton).toBeDisabled();
  });

  it('shows update button text for scheduled content', () => {
    render(<SchedulingModal {...defaultProps} content={mockScheduledContent} />);
    
    expect(screen.getByText('Update Schedule')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<SchedulingModal {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByRole('button', { name: /×/ });
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    render(<SchedulingModal {...defaultProps} onClose={onClose} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('shows preview of selected date and time', () => {
    render(<SchedulingModal {...defaultProps} />);
    
    const dateInput = screen.getByLabelText('Date');
    const timeInput = screen.getByLabelText('Time');
    
    fireEvent.change(dateInput, { target: { value: '2024-12-25' } });
    fireEvent.change(timeInput, { target: { value: '14:30' } });
    
    expect(screen.getByText('Will be scheduled for:')).toBeInTheDocument();
    expect(screen.getByText(/Tuesday, December 25, 2024/)).toBeInTheDocument();
  });

  it('truncates long content text in preview', () => {
    const longContent = {
      ...mockContent,
      contentData: {
        text: 'This is a very long caption that should be truncated when displayed in the modal preview section because it exceeds the character limit'
      }
    };
    
    render(<SchedulingModal {...defaultProps} content={longContent} />);
    
    const previewText = screen.getByText(/This is a very long caption/);
    expect(previewText.textContent).toMatch(/\.\.\.$/);
  });
});