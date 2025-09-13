import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../contexts/AuthContext';
import { ContentGenerator } from '../../components/content/ContentGenerator';
import { ContentLibrary } from '../../components/content/ContentLibrary';
import { AnalyticsDashboard } from '../../components/analytics/AnalyticsDashboard';

// Test wrapper with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('Component Performance Tests', () => {
  describe('Render Performance', () => {
    it('should render ContentGenerator quickly', () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <ContentGenerator />
        </TestWrapper>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('should render ContentLibrary quickly', () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <ContentLibrary />
        </TestWrapper>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('should render AnalyticsDashboard quickly', () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <AnalyticsDashboard />
        </TestWrapper>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within 150ms (charts might be slower)
      expect(renderTime).toBeLessThan(150);
    });
  });

  describe('Memory Usage', () => {
    it('should not cause memory leaks with repeated renders', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Render component multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <TestWrapper>
            <ContentGenerator />
          </TestWrapper>
        );
        unmount();
      }
      
      // Force garbage collection if available
      if ((global as any).gc) {
        (global as any).gc();
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Memory increase should be reasonable (less than 10MB)
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      }
    });
  });

  describe('Re-render Performance', () => {
    it('should handle prop changes efficiently', () => {
      const { rerender } = render(
        <TestWrapper>
          <ContentGenerator />
        </TestWrapper>
      );
      
      const startTime = performance.now();
      
      // Simulate multiple re-renders
      for (let i = 0; i < 5; i++) {
        rerender(
          <TestWrapper>
            <ContentGenerator />
          </TestWrapper>
        );
      }
      
      const endTime = performance.now();
      const rerenderTime = endTime - startTime;
      
      // Re-renders should be fast
      expect(rerenderTime).toBeLessThan(50);
    });
  });

  describe('Large Dataset Performance', () => {
    it('should handle large content lists efficiently', () => {
      // Mock large dataset
      const mockContent = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        platform: 'instagram',
        contentType: 'caption',
        contentData: { text: `Test content ${i}` },
        createdAt: new Date(),
      }));

      // Mock the hook to return large dataset
      vi.mock('../../hooks/useContent', () => ({
        useContent: () => ({
          data: { content: mockContent, total: 100 },
          isLoading: false,
          error: null,
        }),
      }));

      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <ContentLibrary />
        </TestWrapper>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should handle large datasets within reasonable time
      expect(renderTime).toBeLessThan(500);
    });
  });
});