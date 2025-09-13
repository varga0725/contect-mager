import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../../../test/test-utils';
import { ProtectedRoute } from '../ProtectedRoute';

// Mock the useAuth hook
const mockAuthContext = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
};

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('ProtectedRoute', () => {
  it('shows loading spinner when authentication is loading', () => {
    mockAuthContext.isLoading = true;
    mockAuthContext.isAuthenticated = false;
    
    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('shows access denied message when user is not authenticated', () => {
    mockAuthContext.isLoading = false;
    mockAuthContext.isAuthenticated = false;
    
    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText('Please sign in to access this page.')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('shows custom fallback when provided and user is not authenticated', () => {
    mockAuthContext.isLoading = false;
    mockAuthContext.isAuthenticated = false;
    
    const customFallback = <div>Custom Fallback</div>;
    
    render(
      <ProtectedRoute fallback={customFallback}>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    mockAuthContext.isLoading = false;
    mockAuthContext.isAuthenticated = true;
    
    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
  });
});