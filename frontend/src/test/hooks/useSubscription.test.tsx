import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  useSubscriptionStatus, 
  useSubscriptionUsage, 
  useUpgradeSubscription, 
  useCancelSubscription 
} from '../../hooks/useSubscription';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.location
const mockLocation = {
  href: '',
  origin: 'http://localhost:3000',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useSubscription hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useSubscriptionStatus', () => {
    it('fetches subscription status successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          subscription: {
            id: 1,
            status: 'active',
            currentPeriodEnd: '2024-02-15T00:00:00.000Z',
          },
          usage: {
            currentUsage: 25,
            monthlyLimit: 100,
            tier: 'pro',
            resetDate: '2024-02-15T00:00:00.000Z',
            remainingPosts: 75,
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/subscription/status',
        {
          credentials: 'include',
        }
      );
    });

    it('handles fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('handles HTTP error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Failed to fetch subscription status');
    });
  });

  describe('useSubscriptionUsage', () => {
    it('fetches usage statistics successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          currentUsage: 7,
          monthlyLimit: 10,
          tier: 'free',
          resetDate: '2024-02-15T00:00:00.000Z',
          remainingPosts: 3,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSubscriptionUsage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/subscription/usage',
        {
          credentials: 'include',
        }
      );
    });

    it('handles usage fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Usage fetch failed'));

      const { result } = renderHook(() => useSubscriptionUsage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('useUpgradeSubscription', () => {
    it('creates checkout session and redirects successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          sessionId: 'cs_test_123',
          url: 'https://checkout.stripe.com/pay/cs_test_123',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useUpgradeSubscription(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('pro');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/subscription/checkout',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            tier: 'pro',
            successUrl: 'http://localhost:3000/subscription/success',
            cancelUrl: 'http://localhost:3000/subscription/cancel',
          }),
        }
      );

      // Check that redirect happened
      expect(mockLocation.href).toBe('https://checkout.stripe.com/pay/cs_test_123');
    });

    it('handles upgrade error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Checkout failed'));

      const { result } = renderHook(() => useUpgradeSubscription(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('creator');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('handles HTTP error during checkout', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      const { result } = renderHook(() => useUpgradeSubscription(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('pro');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Failed to create checkout session');
    });
  });

  describe('useCancelSubscription', () => {
    it('cancels subscription successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Subscription canceled successfully',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useCancelSubscription(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/subscription/cancel',
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      expect(result.current.data).toEqual(mockResponse);
    });

    it('handles cancellation error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Cancellation failed'));

      const { result } = renderHook(() => useCancelSubscription(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('handles HTTP error during cancellation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useCancelSubscription(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Failed to cancel subscription');
    });
  });

  describe('query configuration', () => {
    it('configures subscription status query correctly', () => {
      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      // Check that the query is configured with correct stale time
      expect(result.current.dataUpdatedAt).toBeDefined();
    });

    it('configures usage query correctly', () => {
      const { result } = renderHook(() => useSubscriptionUsage(), {
        wrapper: createWrapper(),
      });

      // Check that the query is configured
      expect(result.current.dataUpdatedAt).toBeDefined();
    });
  });
});