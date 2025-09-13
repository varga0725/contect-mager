import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOnlineStatus, useNetworkStatus } from '../../hooks/useOnlineStatus';

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

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

describe('useOnlineStatus hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset navigator.onLine to true
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    // Clean up event listeners
    window.removeEventListener('online', vi.fn());
    window.removeEventListener('offline', vi.fn());
  });

  describe('useOnlineStatus', () => {
    it('should return initial online status', () => {
      const { result } = renderHook(() => useOnlineStatus(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBe(true);
    });

    it('should update status when going offline', () => {
      const { result } = renderHook(() => useOnlineStatus(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBe(true);

      // Simulate going offline
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: false,
        });
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current).toBe(false);
    });

    it('should update status when coming back online', () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const { result } = renderHook(() => useOnlineStatus(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBe(false);

      // Simulate coming back online
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: true,
        });
        window.dispatchEvent(new Event('online'));
      });

      expect(result.current).toBe(true);
    });
  });

  describe('useNetworkStatus', () => {
    it('should return correct network status when online', () => {
      const { result } = renderHook(() => useNetworkStatus(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isOnline).toBe(true);
      expect(result.current.isOffline).toBe(false);
      expect(result.current.justCameOnline).toBe(false);
    });

    it('should return correct network status when offline', () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const { result } = renderHook(() => useNetworkStatus(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isOnline).toBe(false);
      expect(result.current.isOffline).toBe(true);
      expect(result.current.justCameOnline).toBe(false);
    });

    it('should detect when just came back online', () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const { result } = renderHook(() => useNetworkStatus(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isOffline).toBe(true);

      // Come back online
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: true,
        });
        window.dispatchEvent(new Event('online'));
      });

      expect(result.current.isOnline).toBe(true);
      expect(result.current.justCameOnline).toBe(true);
    });
  });
});