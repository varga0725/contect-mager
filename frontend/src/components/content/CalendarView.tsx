import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { GeneratedContent, Platform, CalendarEvent } from '../../types';

interface CalendarViewProps {
  scheduledContent: GeneratedContent[];
  onDateSelect: (date: Date) => void;
  onEventClick: (content: GeneratedContent) => void;
  onScheduleContent: (date: Date) => void;
  selectedDate?: Date;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const PLATFORM_COLORS: Record<Platform, string> = {
  instagram: 'bg-pink-500',
  tiktok: 'bg-black',
  youtube: 'bg-red-500',
  linkedin: 'bg-blue-600',
  twitter: 'bg-blue-400',
};

export function CalendarView({
  scheduledContent,
  onDateSelect,
  onEventClick,
  onScheduleContent,
  selectedDate
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Group scheduled content by date
  const contentByDate = useMemo(() => {
    const grouped: Record<string, GeneratedContent[]> = {};
    
    scheduledContent.forEach(content => {
      if (content.scheduledAt) {
        const dateKey = new Date(content.scheduledAt).toDateString();
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(content);
      }
    });
    
    return grouped;
  }, [scheduledContent]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    const days: (Date | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  }, [currentDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateClick = (date: Date) => {
    onDateSelect(date);
  };

  const handleScheduleClick = (date: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    onScheduleContent(date);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {DAYS_OF_WEEK.map(day => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-gray-500 border-b"
            >
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((date, index) => (
            <div
              key={index}
              className={`
                min-h-[100px] p-1 border border-gray-200 cursor-pointer
                hover:bg-gray-50 transition-colors
                ${date && isSelected(date) ? 'bg-blue-50 border-blue-300' : ''}
                ${date && isToday(date) ? 'bg-yellow-50' : ''}
                ${date && isPastDate(date) ? 'bg-gray-100 opacity-60' : ''}
              `}
              onClick={() => date && handleDateClick(date)}
            >
              {date && (
                <>
                  {/* Date number */}
                  <div className="flex items-center justify-between mb-1">
                    <span className={`
                      text-sm font-medium
                      ${isToday(date) ? 'text-blue-600 font-bold' : ''}
                      ${isPastDate(date) ? 'text-gray-400' : ''}
                    `}>
                      {date.getDate()}
                    </span>
                    {!isPastDate(date) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                        onClick={(e) => handleScheduleClick(date, e)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Scheduled content */}
                  <div className="space-y-1">
                    {contentByDate[date.toDateString()]?.slice(0, 3).map(content => (
                      <div
                        key={content.id}
                        className={`
                          text-xs p-1 rounded cursor-pointer
                          ${PLATFORM_COLORS[content.platform]} text-white
                          hover:opacity-80 transition-opacity
                        `}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(content);
                        }}
                        title={`${content.platform} - ${content.contentType}`}
                      >
                        <div className="truncate">
                          {content.contentData.text?.slice(0, 20) || 
                           `${content.contentType} content`}
                        </div>
                      </div>
                    ))}
                    
                    {/* Show "more" indicator if there are additional items */}
                    {contentByDate[date.toDateString()]?.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{contentByDate[date.toDateString()].length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-200 rounded"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-200 rounded"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-200 rounded"></div>
            <span>Past</span>
          </div>
        </div>
        
        {/* Platform legend */}
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          {Object.entries(PLATFORM_COLORS).map(([platform, color]) => (
            <div key={platform} className="flex items-center gap-2">
              <div className={`w-3 h-3 ${color} rounded`}></div>
              <span className="capitalize">{platform}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}