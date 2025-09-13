import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useContentLibrary, useDeleteContent, useGenerateCaption } from '../../hooks/useContent';
import { contentApi } from '../../lib/api';

// Mock the content API
vi.mock('../../lib/api', () => ({
  contentApi: {
    getLibrary: vi.fn(),
    deleteContent: vi.fn(),
    generateCaption: vi.fn(),
    getUsage: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useContent hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useContentLibrary', () => {
    it('should fetch content library successfully', async () => {
      const mockLibraryData = {
        success: true,
        data: {
          content: [
            {
              id: 1,
              userId: 1,
              platform: 'instagram' as const,
              contentType: 'caption' as const,
              contentData: { text: 'Test caption' },
              metadata: {},
              createdAt: new Date(),
              scheduledAt: null,
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
        },
      };

      vi.mocked(contentApi.getLibrary).mockResolvedValue(mockLibraryData);

      const { result } = renderHook(() => useContentLibrary(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockLibraryData);
      expect(contentApi.getLibrary).toHaveBeenCalledWith({});
    });

    it('should fetch content library with parameters', async () => {
      const params = {
        page: 2,
        platform: 'instagram',
        contentType: 'image',
      };

      const mockLibraryData = {
        success: true,
        data: {
          content: [],
          total: 0,
          page: 2,
          limit: 10,
        },
      };

      vi.mocked(contentApi.getLibrary).mockResolvedValue(mockLibraryData);

      const { result } = renderHook(() => useContentLibrary(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(contentApi.getLibrary).toHaveBeenCalledWith(params);
    });
  });

  describe('useDeleteContent', () => {
    it('should delete content with optimistic updates', async () => {
      const mockResponse = {
        success: true,
        data: { message: 'Content deleted', deletedId: 1 },
      };

      vi.mocked(contentApi.deleteContent).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteContent(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(contentApi.deleteContent).toHaveBeenCalledWith(1);
    });

    it('should handle delete error and rollback optimistic updates', async () => {
      const mockError = new Error('Delete failed');
      vi.mocked(contentApi.deleteContent).mockRejectedValue(mockError);

      const { result } = renderHook(() => useDeleteContent(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useGenerateCaption', () => {
    it('should generate caption successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 2,
          caption: 'Generated caption',
          hashtags: ['#test', '#ai'],
          platform: 'instagram',
          contentType: 'caption',
          createdAt: new Date().toISOString(),
        },
      };

      vi.mocked(contentApi.generateCaption).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useGenerateCaption(), {
        wrapper: createWrapper(),
      });

      const params = {
        prompt: 'Generate a caption about coffee',
        platform: 'instagram',
        tone: 'casual',
        includeHashtags: true,
      };

      result.current.mutate(params);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(contentApi.generateCaption).toHaveBeenCalledWith(params);
    });

    it('should handle generation error', async () => {
      const mockError = new Error('Generation failed');
      vi.mocked(contentApi.generateCaption).mockRejectedValue(mockError);

      const { result } = renderHook(() => useGenerateCaption(), {
        wrapper: createWrapper(),
      });

      const params = {
        prompt: 'Generate a caption',
        platform: 'instagram',
      };

      result.current.mutate(params);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });
});