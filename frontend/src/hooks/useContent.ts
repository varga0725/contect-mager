import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '../lib/api';
import type { GeneratedContent } from '../types';

export const CONTENT_QUERY_KEYS = {
  all: ['content'] as const,
  library: (params?: any) => ['content', 'library', params] as const,
  usage: () => ['content', 'usage'] as const,
} as const;

interface ContentLibraryParams {
  page?: number;
  limit?: number;
  platform?: string;
  contentType?: string;
  sortBy?: string;
  sortOrder?: string;
}

export function useContentLibrary(params: ContentLibraryParams = {}) {
  return useQuery({
    queryKey: CONTENT_QUERY_KEYS.library(params),
    queryFn: () => contentApi.getLibrary(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true, // Keep previous data while loading new page
  });
}

export function useContentUsage() {
  return useQuery({
    queryKey: CONTENT_QUERY_KEYS.usage(),
    queryFn: contentApi.getUsage,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: contentApi.deleteContent,
    onMutate: async (contentId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: CONTENT_QUERY_KEYS.all });
      
      // Snapshot the previous value
      const previousLibraryData = queryClient.getQueriesData({ queryKey: CONTENT_QUERY_KEYS.all });
      
      // Optimistically update library data
      queryClient.setQueriesData(
        { queryKey: CONTENT_QUERY_KEYS.all },
        (old: any) => {
          if (!old?.data?.content) return old;
          
          return {
            ...old,
            data: {
              ...old.data,
              content: old.data.content.filter((item: GeneratedContent) => item.id !== contentId),
              total: old.data.total - 1,
            },
          };
        }
      );
      
      return { previousLibraryData };
    },
    onError: (err, contentId, context) => {
      // Rollback optimistic updates on error
      if (context?.previousLibraryData) {
        context.previousLibraryData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEYS.usage() });
    },
  });
}

export function useGenerateCaption() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: contentApi.generateCaption,
    onSuccess: (data) => {
      // Invalidate and refetch content library
      queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEYS.usage() });
      
      // Optionally add the new content to the cache optimistically
      queryClient.setQueriesData(
        { queryKey: CONTENT_QUERY_KEYS.all },
        (old: any) => {
          if (!old?.data?.content) return old;
          
          const newContent: GeneratedContent = {
            id: data.data.id,
            userId: 0, // Will be set by server
            platform: data.data.platform as any,
            contentType: data.data.contentType as any,
            contentData: {
              text: data.data.caption,
              hashtags: data.data.hashtags,
            },
            metadata: {},
            createdAt: new Date(data.data.createdAt),
            scheduledAt: null,
          };
          
          return {
            ...old,
            data: {
              ...old.data,
              content: [newContent, ...old.data.content],
              total: old.data.total + 1,
            },
          };
        }
      );
    },
  });
}

export function useGenerateImage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: contentApi.generateImage,
    onSuccess: (data) => {
      // Invalidate and refetch content library
      queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEYS.usage() });
      
      // Optionally add the new content to the cache optimistically
      queryClient.setQueriesData(
        { queryKey: CONTENT_QUERY_KEYS.all },
        (old: any) => {
          if (!old?.data?.content) return old;
          
          const newContent: GeneratedContent = {
            id: data.data.id,
            userId: 0, // Will be set by server
            platform: data.data.platform as any,
            contentType: data.data.contentType as any,
            contentData: {
              imageUrl: data.data.imageUrl,
              text: data.data.description,
            },
            metadata: {
              dimensions: data.data.dimensions,
            },
            createdAt: new Date(data.data.createdAt),
            scheduledAt: null,
          };
          
          return {
            ...old,
            data: {
              ...old.data,
              content: [newContent, ...old.data.content],
              total: old.data.total + 1,
            },
          };
        }
      );
    },
  });
}

export function useGenerateVideo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: contentApi.generateVideo,
    onSuccess: (data) => {
      // Invalidate and refetch content library
      queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEYS.usage() });
      
      // Optionally add the new content to the cache optimistically
      queryClient.setQueriesData(
        { queryKey: CONTENT_QUERY_KEYS.all },
        (old: any) => {
          if (!old?.data?.content) return old;
          
          const newContent: GeneratedContent = {
            id: data.data.id,
            userId: 0, // Will be set by server
            platform: data.data.platform as any,
            contentType: data.data.contentType as any,
            contentData: {
              videoUrl: data.data.videoUrl,
              text: data.data.description,
            },
            metadata: {
              duration: data.data.duration,
              aspectRatio: data.data.aspectRatio,
            },
            createdAt: new Date(data.data.createdAt),
            scheduledAt: null,
          };
          
          return {
            ...old,
            data: {
              ...old.data,
              content: [newContent, ...old.data.content],
              total: old.data.total + 1,
            },
          };
        }
      );
    },
  });
}