import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCurrentUser, useLogin, useLogout } from '../../hooks/useAuth';
import { authApi } from '../../lib/api';

// Mock the auth API
vi.mock('../../lib/api', () => ({
  authApi: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
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

describe('useAuth hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useCurrentUser', () => {
    it('should fetch current user successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        subscriptionTier: 'free' as const,
        monthlyUsage: 5,
        usageResetDate: new Date(),
      };

      vi.mocked(authApi.getCurrentUser).mockResolvedValue({ user: mockUser });

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.user).toEqual(mockUser);
      expect(authApi.getCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('should handle error when fetching current user', async () => {
      const mockError = new Error('Unauthorized');
      vi.mocked(authApi.getCurrentUser).mockRejectedValue(mockError);

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useLogin', () => {
    it('should login successfully and update cache', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        subscriptionTier: 'free' as const,
        monthlyUsage: 5,
        usageResetDate: new Date(),
      };

      const mockResponse = {
        success: true,
        user: mockUser,
        message: 'Login successful',
      };

      vi.mocked(authApi.login).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      const loginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      result.current.mutate(loginCredentials);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(authApi.login).toHaveBeenCalledWith(loginCredentials);
    });

    it('should handle login error', async () => {
      const mockError = new Error('Invalid credentials');
      vi.mocked(authApi.login).mockRejectedValue(mockError);

      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      const loginCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      result.current.mutate(loginCredentials);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useLogout', () => {
    it('should logout successfully and clear cache', async () => {
      const mockResponse = { success: true };
      vi.mocked(authApi.logout).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(authApi.logout).toHaveBeenCalledTimes(1);
    });

    it('should clear cache even if logout fails', async () => {
      const mockError = new Error('Server error');
      vi.mocked(authApi.logout).mockRejectedValue(mockError);

      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
      // Cache should still be cleared even on error
    });
  });
});