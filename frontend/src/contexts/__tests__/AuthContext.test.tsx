import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '../../test/test-utils';
import { AuthProvider, useAuth } from '../AuthContext';
import * as api from '../../lib/api';

// Mock the API
vi.mock('../../lib/api', () => ({
  authApi: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    public status: number;
    
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'ApiError';
    }
  },
}));

const mockAuthApi = api.authApi as any;

// Test component that uses the auth context
function TestComponent() {
  const { user, isAuthenticated, isLoading, login, register, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <button onClick={() => login({ email: 'test@example.com', password: 'password' })}>
        Login
      </button>
      <button onClick={() => register({ email: 'test@example.com', password: 'password', confirmPassword: 'password' })}>
        Register
      </button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

function renderWithAuth() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with no user when getCurrentUser returns null', async () => {
    mockAuthApi.getCurrentUser.mockResolvedValue({ user: null });
    
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });
  });

  it('initializes with user when getCurrentUser returns user data', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      subscriptionTier: 'free' as const,
      monthlyUsage: 0,
      usageResetDate: new Date(),
    };
    
    mockAuthApi.getCurrentUser.mockResolvedValue({ user: mockUser });
    
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });
  });

  it('handles login successfully', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      subscriptionTier: 'free' as const,
      monthlyUsage: 0,
      usageResetDate: new Date(),
    };
    
    mockAuthApi.getCurrentUser.mockResolvedValue({ user: null });
    mockAuthApi.login.mockResolvedValue({ success: true, user: mockUser });
    
    renderWithAuth();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    // Click login button
    const loginButton = screen.getByText('Login');
    loginButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });
  });

  it('handles registration successfully', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      subscriptionTier: 'free' as const,
      monthlyUsage: 0,
      usageResetDate: new Date(),
    };
    
    mockAuthApi.getCurrentUser.mockResolvedValue({ user: null });
    mockAuthApi.register.mockResolvedValue({ success: true, user: mockUser });
    
    renderWithAuth();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    // Click register button
    const registerButton = screen.getByText('Register');
    registerButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });
  });

  it('handles logout successfully', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      subscriptionTier: 'free' as const,
      monthlyUsage: 0,
      usageResetDate: new Date(),
    };
    
    mockAuthApi.getCurrentUser.mockResolvedValue({ user: mockUser });
    mockAuthApi.logout.mockResolvedValue({ success: true });
    
    renderWithAuth();

    // Wait for initial load with user
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
    });

    // Click logout button
    const logoutButton = screen.getByText('Logout');
    logoutButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });
  });
});