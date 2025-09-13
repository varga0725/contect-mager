import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { GeneratedContent } from '../../types';

interface SchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: GeneratedContent | null;
  selectedDate?: Date;
  onSchedule: (postId: number, scheduledAt: string) => Promise<void>;
  onUnschedule: (postId: number) => Promise<void>;
  isLoading?: boolean;
}

export function SchedulingModal({
  isOpen,
  onClose,
  content,
  selectedDate,
  onSchedule,
  onUnschedule,
  isLoading = false
}: SchedulingModalProps) {
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  useEffect(() => {
    if (isOpen && content) {
      if (content.scheduledAt) {
        const date = new Date(content.scheduledAt);
        setScheduledDate(date.toISOString().split('T')[0]);
        setScheduledTime(date.toTimeString().slice(0, 5));
      } else if (selectedDate) {
        setScheduledDate(selectedDate.toISOString().split('T')[0]);
        setScheduledTime('09:00');
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setScheduledDate(tomorrow.toISOString().split('T')[0]);
        setScheduledTime('09:00');
      }
    }
  }, [isOpen, content, selectedDate]);

  const handleSchedule = async () => {
    if (!content || !scheduledDate || !scheduledTime) return;

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    
    // Validate that the date is in the future
    if (scheduledDateTime <= new Date()) {
      alert('Please select a future date and time');
      return;
    }

    try {
      await onSchedule(content.id, scheduledDateTime.toISOString());
      onClose();
    } catch (error) {
      console.error('Failed to schedule content:', error);
    }
  };

  const handleUnschedule = async () => {
    if (!content) return;

    try {
      await onUnschedule(content.id);
      onClose();
    } catch (error) {
      console.error('Failed to unschedule content:', error);
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen || !content) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule Content
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Content Preview */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium capitalize">{content.platform}</span>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                {content.contentType}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {content.contentData.text?.slice(0, 100) || 
               `${content.contentType} content`}
              {content.contentData.text && content.contentData.text.length > 100 && '...'}
            </div>
          </div>

          {/* Current Schedule Status */}
          {content.scheduledAt && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Currently Scheduled</span>
              </div>
              <div className="text-sm text-blue-600 mt-1">
                {formatDateTime(new Date(content.scheduledAt))}
              </div>
            </div>
          )}

          {/* Date Input */}
          <div className="space-y-2">
            <Label htmlFor="scheduled-date">Date</Label>
            <Input
              id="scheduled-date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Time Input */}
          <div className="space-y-2">
            <Label htmlFor="scheduled-time">Time</Label>
            <Input
              id="scheduled-time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>

          {/* Preview of selected date/time */}
          {scheduledDate && scheduledTime && (
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-sm text-green-700">
                <strong>Will be scheduled for:</strong><br />
                {formatDateTime(new Date(`${scheduledDate}T${scheduledTime}`))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSchedule}
              disabled={!scheduledDate || !scheduledTime || isLoading}
              className="flex-1"
            >
              {isLoading ? 'Scheduling...' : 
               content.scheduledAt ? 'Update Schedule' : 'Schedule'}
            </Button>
            
            {content.scheduledAt && (
              <Button
                variant="outline"
                onClick={handleUnschedule}
                disabled={isLoading}
              >
                {isLoading ? 'Removing...' : 'Unschedule'}
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}