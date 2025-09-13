import { useState, useCallback } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

export function useLoadingState(initialState: LoadingState = {}) {
  const [loadingStates, setLoadingStates] = useState<LoadingState>(initialState);

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading,
    }));
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  const withLoading = useCallback(
    <T extends any[], R>(
      key: string,
      fn: (...args: T) => Promise<R>
    ) => {
      return async (...args: T): Promise<R> => {
        setLoading(key, true);
        try {
          const result = await fn(...args);
          return result;
        } finally {
          setLoading(key, false);
        }
      };
    },
    [setLoading]
  );

  return {
    loadingStates,
    setLoading,
    isLoading,
    isAnyLoading,
    withLoading,
  };
}

export function useAsyncOperation<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  key?: string
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<R | null>(null);

  const execute = useCallback(
    async (...args: T) => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await operation(...args);
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [operation]
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    execute,
    isLoading,
    error,
    data,
    reset,
  };
}