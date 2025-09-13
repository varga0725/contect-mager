import React from 'react';
import { Button } from './button';
import { Card } from './card';
import { ApiError } from '../../lib/api';

interface ErrorMessageProps {
  error: Error | ApiError | string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  variant?: 'default' | 'destructive' | 'warning';
  showDetails?: boolean;
}

export function ErrorMessage({ 
  error, 
  onRetry, 
  onDismiss, 
  className = '',
  variant = 'destructive',
  showDetails = false
}: ErrorMessageProps) {
  const errorMessage = typeof error === 'string' ? error : error?.message || 'An unknown error occurred';
  const isApiError = error instanceof ApiError;
  
  // Get user-friendly error message
  const getUserFriendlyMessage = (error: Error | ApiError | string): string => {
    if (typeof error === 'string') return error;
    
    if (isApiError) {
      const apiError = error as ApiError;
      
      switch (apiError.code) {
        case 'UNAUTHORIZED':
          return 'Please log in to continue.';
        case 'FORBIDDEN':
          return 'You don\'t have permission to perform this action.';
        case 'VALIDATION_ERROR':
          return 'Please check your input and try again.';
        case 'USAGE_LIMIT_EXCEEDED':
          return 'You\'ve reached your usage limit. Please upgrade your plan to continue.';
        case 'RATE_LIMIT_EXCEEDED':
          return 'Too many requests. Please wait a moment and try again.';
        case 'AI_SERVICE_ERROR':
          return 'AI service is temporarily unavailable. Please try again.';
        case 'NETWORK_ERROR':
          return 'Unable to connect to the server. Please check your internet connection.';
        case 'TIMEOUT_ERROR':
          return 'Request timed out. Please try again.';
        case 'RESOURCE_NOT_FOUND':
          return 'The requested resource was not found.';
        case 'INTERNAL_ERROR':
          return 'Something went wrong on our end. Please try again.';
        default:
          return apiError.message;
      }
    }
    
    return error?.message || 'An unknown error occurred';
  };

  const getErrorIcon = () => {
    if (variant === 'warning') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    }
    
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'destructive':
        return 'border-red-200 bg-red-50 text-red-800';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const shouldShowRetry = () => {
    if (!isApiError) return true;
    
    const apiError = error as ApiError;
    // Don't show retry for client errors (except rate limits and timeouts)
    if (apiError.status >= 400 && apiError.status < 500) {
      return ['RATE_LIMIT_EXCEEDED', 'TIMEOUT_ERROR', 'NETWORK_ERROR'].includes(apiError.code || '');
    }
    
    return true;
  };

  return (
    <Card className={`p-4 ${getVariantClasses()} ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getErrorIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium">
            {getUserFriendlyMessage(error)}
          </p>
          
          {showDetails && isApiError && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm opacity-75">
                Technical Details
              </summary>
              <div className="mt-2 text-sm opacity-75 font-mono">
                <div>Code: {(error as ApiError).code}</div>
                <div>Status: {(error as ApiError).status}</div>
                {(error as ApiError).requestId && (
                  <div>Request ID: {(error as ApiError).requestId}</div>
                )}
              </div>
            </details>
          )}
        </div>
        
        <div className="flex-shrink-0 flex space-x-2">
          {onRetry && shouldShowRetry() && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Try Again
            </Button>
          )}
          
          {onDismiss && (
            <Button
              onClick={onDismiss}
              variant="ghost"
              size="sm"
              className="text-xs p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// Inline error message for forms
interface InlineErrorProps {
  error?: string | Error;
  className?: string;
}

export function InlineError({ error, className = '' }: InlineErrorProps) {
  if (!error) return null;
  
  const message = typeof error === 'string' ? error : error.message;
  
  return (
    <p className={`text-sm text-red-600 mt-1 ${className}`}>
      {message}
    </p>
  );
}

// Toast-style error notification
interface ErrorToastProps {
  error: Error | ApiError | string;
  onClose: () => void;
  duration?: number;
}

export function ErrorToast({ error, onClose, duration = 5000 }: ErrorToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <ErrorMessage
        error={error}
        onDismiss={onClose}
        variant="destructive"
        className="shadow-lg"
      />
    </div>
  );
}