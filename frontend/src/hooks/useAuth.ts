import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../lib/api';
import type { LoginCredentials, RegisterCredentials, User } from '../types';

export const AUTH_QUERY_KEYS = {
  currentUser: ['auth', 'currentUser'] as const,
} as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: AUTH_QUERY_KEYS.currentUser,
    queryFn: authApi.getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 401/403 errors
      if (error?.status === 401 || error?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // Update the current user cache with the logged-in user
      queryClient.setQueryData(AUTH_QUERY_KEYS.currentUser, { user: data.user });
      
      // Invalidate and refetch user-specific data
      queryClient.invalidateQueries({ queryKey: ['content'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      // Update the current user cache with the registered user
      queryClient.setQueryData(AUTH_QUERY_KEYS.currentUser, { user: data.user });
      
      // Invalidate and refetch user-specific data
      queryClient.invalidateQueries({ queryKey: ['content'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
    onError: (error) => {
      console.error('Registration failed:', error);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear all cached data on logout
      queryClient.clear();
      
      // Set current user to null
      queryClient.setQueryData(AUTH_QUERY_KEYS.currentUser, { user: null });
    },
    onError: (error) => {
      console.error('Logout failed:', error);
      // Even if logout fails on server, clear local cache
      queryClient.clear();
      queryClient.setQueryData(AUTH_QUERY_KEYS.currentUser, { user: null });
    },
  });
}