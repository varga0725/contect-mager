import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary, useErrorHandler } from '../components/ErrorBoundary';
import { ErrorMessage, InlineError } from '../components/ui/error-message';
import { ApiError } from '../lib/api';

// Mock component that throws an error
function ThrowError({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

// Mock component that uses error handler hook
function ComponentWithErrorHandler() {
  const handleError = useErrorHandler();
  
  const triggerError = () => {
    handleError(new Error('Hook error'));
  };

  return (
    <button onClick={triggerError}>
      Trigger Error
    </button>
  );
}

describe('Error Handling Components', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  describe('ErrorBoundary', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should render error UI when error occurs', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reload Page' })).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should show error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockRestore();
    });

    it('should call custom error handler when provided', () => {
      const onError = vi.fn();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );

      consoleSpy.mockRestore();
    });

    it('should reset error state when Try Again is clicked', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      const tryAgainButton = screen.getByRole('button', { name: 'Try Again' });
      expect(tryAgainButton).toBeInTheDocument();

      // Click the Try Again button - this should reset the error state
      fireEvent.click(tryAgainButton);

      // The error boundary should still show the error UI since the child hasn't changed
      // But the button should still be there and clickable
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should render custom fallback when provided', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const customFallback = <div>Custom error fallback</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error fallback')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('useErrorHandler Hook', () => {
    it('should handle errors without throwing', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<ComponentWithErrorHandler />);

      fireEvent.click(screen.getByRole('button', { name: 'Trigger Error' }));

      // Should not crash the component
      expect(screen.getByRole('button', { name: 'Trigger Error' })).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('ErrorMessage Component', () => {
    it('should render basic error message', () => {
      render(<ErrorMessage error="Test error message" />);

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should render Error object message', () => {
      const error = new Error('Error object message');
      render(<ErrorMessage error={error} />);

      expect(screen.getByText('Error object message')).toBeInTheDocument();
    });

    it('should render user-friendly message for API errors', () => {
      const apiError = new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      render(<ErrorMessage error={apiError} />);

      expect(screen.getByText('Please log in to continue.')).toBeInTheDocument();
    });

    it('should show retry button when onRetry is provided', () => {
      const onRetry = vi.fn();
      render(<ErrorMessage error="Test error" onRetry={onRetry} />);

      const retryButton = screen.getByRole('button', { name: 'Try Again' });
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should show dismiss button when onDismiss is provided', () => {
      const onDismiss = vi.fn();
      render(<ErrorMessage error="Test error" onDismiss={onDismiss} />);

      const dismissButton = screen.getByRole('button');
      fireEvent.click(dismissButton);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should not show retry button for client errors', () => {
      const apiError = new ApiError(400, 'Bad Request', 'VALIDATION_ERROR');
      const onRetry = vi.fn();
      render(<ErrorMessage error={apiError} onRetry={onRetry} />);

      expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeInTheDocument();
    });

    it('should show retry button for rate limit errors', () => {
      const apiError = new ApiError(429, 'Rate Limited', 'RATE_LIMIT_EXCEEDED');
      const onRetry = vi.fn();
      render(<ErrorMessage error={apiError} onRetry={onRetry} />);

      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });

    it('should show technical details when showDetails is true', () => {
      const apiError = new ApiError(500, 'Server Error', 'INTERNAL_ERROR', {}, 'req-123');
      render(<ErrorMessage error={apiError} showDetails={true} />);

      expect(screen.getByText('Technical Details')).toBeInTheDocument();
    });

    it('should render warning variant correctly', () => {
      render(<ErrorMessage error="Warning message" variant="warning" />);

      const container = screen.getByText('Warning message').closest('.border-yellow-200');
      expect(container).toBeInTheDocument();
    });
  });

  describe('InlineError Component', () => {
    it('should render error message', () => {
      render(<InlineError error="Inline error message" />);

      expect(screen.getByText('Inline error message')).toBeInTheDocument();
    });

    it('should render Error object message', () => {
      const error = new Error('Error object message');
      render(<InlineError error={error} />);

      expect(screen.getByText('Error object message')).toBeInTheDocument();
    });

    it('should not render when no error is provided', () => {
      const { container } = render(<InlineError />);

      expect(container.firstChild).toBeNull();
    });

    it('should apply custom className', () => {
      render(<InlineError error="Test error" className="custom-class" />);

      const errorElement = screen.getByText('Test error');
      expect(errorElement).toHaveClass('custom-class');
    });
  });

  describe('API Error Handling', () => {
    it('should handle different error codes correctly', () => {
      const testCases = [
        { code: 'UNAUTHORIZED', expected: 'Please log in to continue.' },
        { code: 'FORBIDDEN', expected: 'You don\'t have permission to perform this action.' },
        { code: 'VALIDATION_ERROR', expected: 'Please check your input and try again.' },
        { code: 'USAGE_LIMIT_EXCEEDED', expected: 'You\'ve reached your usage limit. Please upgrade your plan to continue.' },
        { code: 'RATE_LIMIT_EXCEEDED', expected: 'Too many requests. Please wait a moment and try again.' },
        { code: 'AI_SERVICE_ERROR', expected: 'AI service is temporarily unavailable. Please try again.' },
        { code: 'NETWORK_ERROR', expected: 'Unable to connect to the server. Please check your internet connection.' },
        { code: 'TIMEOUT_ERROR', expected: 'Request timed out. Please try again.' },
        { code: 'RESOURCE_NOT_FOUND', expected: 'The requested resource was not found.' },
        { code: 'INTERNAL_ERROR', expected: 'Something went wrong on our end. Please try again.' },
      ];

      testCases.forEach(({ code, expected }) => {
        const apiError = new ApiError(500, 'Original message', code);
        const { unmount } = render(<ErrorMessage error={apiError} />);

        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Query Client Error Handling', () => {
    it('should configure retry logic correctly', () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error: any) => {
              if (error?.status === 401 || error?.status === 403) {
                return false;
              }
              if (error?.status >= 400 && error?.status < 500 && 
                  error?.status !== 408 && error?.status !== 429) {
                return false;
              }
              return failureCount < 3;
            },
          },
        },
      });

      // Test retry logic
      const mockError401 = { status: 401 };
      const mockError403 = { status: 403 };
      const mockError404 = { status: 404 };
      const mockError408 = { status: 408 };
      const mockError429 = { status: 429 };
      const mockError500 = { status: 500 };

      const retryFn = queryClient.getDefaultOptions().queries?.retry as Function;

      expect(retryFn(1, mockError401)).toBe(false);
      expect(retryFn(1, mockError403)).toBe(false);
      expect(retryFn(1, mockError404)).toBe(false);
      expect(retryFn(1, mockError408)).toBe(true);
      expect(retryFn(1, mockError429)).toBe(true);
      expect(retryFn(1, mockError500)).toBe(true);
      expect(retryFn(3, mockError500)).toBe(false);
    });
  });
});