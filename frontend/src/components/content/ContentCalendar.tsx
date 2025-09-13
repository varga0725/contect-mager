import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { CalendarView } from './CalendarView';
import { SchedulingModal } from './SchedulingModal';
import { PlatformSelector } from './PlatformSelector';
import type { GeneratedContent, Platform, CalendarFilters } from '../../types';

interface ContentCalendarProps {
  onScheduleContent: (postId: number, scheduledAt: string) => Promise<void>;
  onUnscheduleContent: (postId: number) => Promise<void>;
  onFetchScheduledContent: (filters?: CalendarFilters) => Promise<GeneratedContent[]>;
  onFetchUserContent: () => Promise<GeneratedContent[]>;
}

export function ContentCalendar({
  onScheduleContent,
  onUnscheduleContent,
  onFetchScheduledContent,
  onFetchUserContent
}: ContentCalendarProps) {
  const [scheduledContent, setScheduledContent] = useState<GeneratedContent[]>([]);
  const [userContent, setUserContent] = useState<GeneratedContent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null);
  const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false);
  const [isContentSelectorOpen, setIsContentSelectorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<CalendarFilters>({});

  // Load scheduled content on mount and when filters change
  useEffect(() => {
    loadScheduledContent();
  }, [filters]);

  // Load user content for scheduling
  useEffect(() => {
    loadUserContent();
  }, []);

  const loadScheduledContent = async () => {
    try {
      setIsLoading(true);
      const content = await onFetchScheduledContent(filters);
      setScheduledContent(content);
    } catch (error) {
      console.error('Failed to load scheduled content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserContent = async () => {
    try {
      const content = await onFetchUserContent();
      setUserContent(content);
    } catch (error) {
      console.error('Failed to load user content:', error);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleEventClick = (content: GeneratedContent) => {
    setSelectedContent(content);
    setIsSchedulingModalOpen(true);
  };

  const handleScheduleContent = (date: Date) => {
    setSelectedDate(date);
    setIsContentSelectorOpen(true);
  };

  const handleContentSelect = (content: GeneratedContent) => {
    setSelectedContent(content);
    setIsContentSelectorOpen(false);
    setIsSchedulingModalOpen(true);
  };

  const handleSchedule = async (postId: number, scheduledAt: string) => {
    try {
      setIsLoading(true);
      await onScheduleContent(postId, scheduledAt);
      await loadScheduledContent();
      await loadUserContent();
    } catch (error) {
      console.error('Failed to schedule content:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnschedule = async (postId: number) => {
    try {
      setIsLoading(true);
      await onUnscheduleContent(postId);
      await loadScheduledContent();
      await loadUserContent();
    } catch (error) {
      console.error('Failed to unschedule content:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlatformFilter = (platform: Platform | null) => {
    setFilters(prev => ({ ...prev, platform }));
  };

  const unscheduledContent = userContent.filter(content => !content.scheduledAt);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Content Calendar</h1>
        </div>
        <Button
          onClick={() => setIsContentSelectorOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Schedule Content
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Platform:</span>
              <PlatformSelector
                selectedPlatform={filters.platform || null}
                onPlatformChange={handlePlatformFilter}
                showAllOption={true}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <CalendarView
        scheduledContent={scheduledContent}
        onDateSelect={handleDateSelect}
        onEventClick={handleEventClick}
        onScheduleContent={handleScheduleContent}
        selectedDate={selectedDate}
      />

      {/* Scheduling Modal */}
      <SchedulingModal
        isOpen={isSchedulingModalOpen}
        onClose={() => {
          setIsSchedulingModalOpen(false);
          setSelectedContent(null);
        }}
        content={selectedContent}
        selectedDate={selectedDate}
        onSchedule={handleSchedule}
        onUnschedule={handleUnschedule}
        isLoading={isLoading}
      />

      {/* Content Selector Modal */}
      {isContentSelectorOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Select Content to Schedule</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsContentSelectorOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              {unscheduledContent.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No unscheduled content available</p>
                  <p className="text-sm">Create some content first to schedule it</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unscheduledContent.map(content => (
                    <div
                      key={content.id}
                      className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleContentSelect(content)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium capitalize">
                            {content.platform}
                          </span>
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                            {content.contentType}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(content.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {content.contentData.text?.slice(0, 150) || 
                         `${content.contentType} content`}
                        {content.contentData.text && content.contentData.text.length > 150 && '...'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}