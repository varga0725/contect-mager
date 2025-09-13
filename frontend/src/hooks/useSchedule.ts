import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { scheduleApi } from '../lib/api';
import type { GeneratedContent } from '../types';

export const SCHEDULE_QUERY_KEYS = {
  all: ['schedule'] as const,
  content: (params?: any) => ['schedule', 'content', params] as const,
} as const;

interface ScheduleParams {
  startDate?: string;
  endDate?: string;
  platform?: string;
}

export function useScheduledContent(params: ScheduleParams = {}) {
  return useQuery({
    queryKey: SCHEDULE_QUERY_KEYS.content(params),
    queryFn: () => scheduleApi.getScheduledContent(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useScheduleContent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ postId, scheduledAt }: { postId: number; scheduledAt: string }) =>
      scheduleApi.scheduleContent(postId, scheduledAt),
    onMutate: async ({ postId, scheduledAt }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: SCHEDULE_QUERY_KEYS.all });
      
      // Snapshot the previous value
      const previousScheduleData = queryClient.getQueriesData({ queryKey: SCHEDULE_QUERY_KEYS.all });
      
      // Optimistically update schedule data
      queryClient.setQueriesData(
        { queryKey: SCHEDULE_QUERY_KEYS.all },
        (old: any) => {
          if (!old?.data) return old;
          
          // Find the content item and update its scheduledAt
          const updatedContent = old.data.map((item: GeneratedContent) =>
            item.id === postId
              ? { ...item, scheduledAt: new Date(scheduledAt) }
              : item
          );
          
          return {
            ...old,
            data: updatedContent,
          };
        }
      );
      
      // Also update content library cache
      queryClient.setQueriesData(
        { queryKey: ['content'] },
        (old: any) => {
          if (!old?.data?.content) return old;
          
          const updatedContent = old.data.content.map((item: GeneratedContent) =>
            item.id === postId
              ? { ...item, scheduledAt: new Date(scheduledAt) }
              : item
          );
          
          return {
            ...old,
            data: {
              ...old.data,
              content: updatedContent,
            },
          };
        }
      );
      
      return { previousScheduleData };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousScheduleData) {
        context.previousScheduleData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });
}

export function useUpdateScheduledContent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ postId, scheduledAt }: { postId: number; scheduledAt: string | null }) =>
      scheduleApi.updateScheduledContent(postId, scheduledAt),
    onMutate: async ({ postId, scheduledAt }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: SCHEDULE_QUERY_KEYS.all });
      
      // Snapshot the previous value
      const previousScheduleData = queryClient.getQueriesData({ queryKey: SCHEDULE_QUERY_KEYS.all });
      
      // Optimistically update schedule data
      queryClient.setQueriesData(
        { queryKey: SCHEDULE_QUERY_KEYS.all },
        (old: any) => {
          if (!old?.data) return old;
          
          const updatedContent = old.data.map((item: GeneratedContent) =>
            item.id === postId
              ? { ...item, scheduledAt: scheduledAt ? new Date(scheduledAt) : null }
              : item
          );
          
          return {
            ...old,
            data: updatedContent,
          };
        }
      );
      
      // Also update content library cache
      queryClient.setQueriesData(
        { queryKey: ['content'] },
        (old: any) => {
          if (!old?.data?.content) return old;
          
          const updatedContent = old.data.content.map((item: GeneratedContent) =>
            item.id === postId
              ? { ...item, scheduledAt: scheduledAt ? new Date(scheduledAt) : null }
              : item
          );
          
          return {
            ...old,
            data: {
              ...old.data,
              content: updatedContent,
            },
          };
        }
      );
      
      return { previousScheduleData };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousScheduleData) {
        context.previousScheduleData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });
}

export function useUnscheduleContent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: scheduleApi.unscheduleContent,
    onMutate: async (postId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: SCHEDULE_QUERY_KEYS.all });
      
      // Snapshot the previous value
      const previousScheduleData = queryClient.getQueriesData({ queryKey: SCHEDULE_QUERY_KEYS.all });
      
      // Optimistically remove from schedule
      queryClient.setQueriesData(
        { queryKey: SCHEDULE_QUERY_KEYS.all },
        (old: any) => {
          if (!old?.data) return old;
          
          const updatedContent = old.data.map((item: GeneratedContent) =>
            item.id === postId
              ? { ...item, scheduledAt: null }
              : item
          );
          
          return {
            ...old,
            data: updatedContent,
          };
        }
      );
      
      // Also update content library cache
      queryClient.setQueriesData(
        { queryKey: ['content'] },
        (old: any) => {
          if (!old?.data?.content) return old;
          
          const updatedContent = old.data.content.map((item: GeneratedContent) =>
            item.id === postId
              ? { ...item, scheduledAt: null }
              : item
          );
          
          return {
            ...old,
            data: {
              ...old.data,
              content: updatedContent,
            },
          };
        }
      );
      
      return { previousScheduleData };
    },
    onError: (err, postId, context) => {
      // Rollback optimistic updates on error
      if (context?.previousScheduleData) {
        context.previousScheduleData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });
}