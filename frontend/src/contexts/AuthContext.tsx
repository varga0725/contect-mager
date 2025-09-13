import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { 
  User, 
  AuthContextType, 
  LoginCredentials, 
  RegisterCredentials 
} from '../types';
import { authApi, ApiError } from '../lib/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  // Query to get current user on app load
  const { data: userData, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update user state when query data changes
  useEffect(() => {
    if (userData?.user) {
      setUser(userData.user);
    } else {
      setUser(null);
    }
  }, [userData]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      if (data.success && data.user) {
        setUser(data.user);
        queryClient.setQueryData(['currentUser'], { user: data.user });
      } else {
        throw new Error(data.error || 'Login failed');
      }
    },
    onError: (error) => {
      console.error('Login error:', error);
      throw error;
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      if (data.success && data.user) {
        setUser(data.user);
        queryClient.setQueryData(['currentUser'], { user: data.user });
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    },
    onError: (error) => {
      console.error('Registration error:', error);
      throw error;
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      setUser(null);
      queryClient.setQueryData(['currentUser'], { user: null });
      queryClient.clear(); // Clear all cached data on logout
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Even if logout fails on server, clear local state
      setUser(null);
      queryClient.setQueryData(['currentUser'], { user: null });
      queryClient.clear();
    },
  });

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      await loginMutation.mutateAsync(credentials);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Login failed. Please try again.');
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<void> => {
    try {
      await registerMutation.mutateAsync(credentials);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Registration failed. Please try again.');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if server request fails
    }
  };

  const value: AuthContextType = {
    user,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}