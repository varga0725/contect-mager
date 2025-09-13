import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLoadingState, useAsyncOperation } from '../../hooks/useLoadingState';

describe('useLoadingState', () => {
  it('should initialize with empty loading state', () => {
    const { result } = renderHook(() => useLoadingState());

    expect(result.current.loadingStates).toEqual({});
    expect(result.current.isAnyLoading()).toBe(false);
  });

  it('should initialize with provided initial state', () => {
    const initialState = { operation1: true, operation2: false };
    const { result } = renderHook(() => useLoadingState(initialState));

    expect(result.current.loadingStates).toEqual(initialState);
    expect(result.current.isLoading('operation1')).toBe(true);
    expect(result.current.isLoading('operation2')).toBe(false);
    expect(result.current.isAnyLoading()).toBe(true);
  });

  it('should set loading state correctly', () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.setLoading('test', true);
    });

    expect(result.current.isLoading('test')).toBe(true);
    expect(result.current.isAnyLoading()).toBe(true);

    act(() => {
      result.current.setLoading('test', false);
    });

    expect(result.current.isLoading('test')).toBe(false);
    expect(result.current.isAnyLoading()).toBe(false);
  });

  it('should handle multiple loading states', () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.setLoading('operation1', true);
      result.current.setLoading('operation2', true);
    });

    expect(result.current.isLoading('operation1')).toBe(true);
    expect(result.current.isLoading('operation2')).toBe(true);
    expect(result.current.isAnyLoading()).toBe(true);

    act(() => {
      result.current.setLoading('operation1', false);
    });

    expect(result.current.isLoading('operation1')).toBe(false);
    expect(result.current.isLoading('operation2')).toBe(true);
    expect(result.current.isAnyLoading()).toBe(true);
  });

  it('should wrap function with loading state', async () => {
    const { result } = renderHook(() => useLoadingState());

    const mockFn = vi.fn().mockResolvedValue('success');
    const wrappedFn = result.current.withLoading('test', mockFn);

    expect(result.current.isLoading('test')).toBe(false);

    const promise = wrappedFn('arg1', 'arg2');

    expect(result.current.isLoading('test')).toBe(true);

    const response = await promise;

    expect(result.current.isLoading('test')).toBe(false);
    expect(response).toBe('success');
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should handle errors in wrapped function', async () => {
    const { result } = renderHook(() => useLoadingState());

    const mockError = new Error('Test error');
    const mockFn = vi.fn().mockRejectedValue(mockError);
    const wrappedFn = result.current.withLoading('test', mockFn);

    expect(result.current.isLoading('test')).toBe(false);

    try {
      await wrappedFn();
    } catch (error) {
      expect(error).toBe(mockError);
    }

    expect(result.current.isLoading('test')).toBe(false);
  });
});

describe('useAsyncOperation', () => {
  it('should initialize with correct default state', () => {
    const mockOperation = vi.fn();
    const { result } = renderHook(() => useAsyncOperation(mockOperation));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe(null);
  });

  it('should handle successful operation', async () => {
    const mockOperation = vi.fn().mockResolvedValue('success');
    const { result } = renderHook(() => useAsyncOperation(mockOperation));

    expect(result.current.isLoading).toBe(false);

    let promise: Promise<any>;
    act(() => {
      promise = result.current.execute('arg1', 'arg2');
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(null);

    const response = await promise!;

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBe('success');
    expect(result.current.error).toBe(null);
    expect(response).toBe('success');
    expect(mockOperation).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should handle operation error', async () => {
    const mockError = new Error('Test error');
    const mockOperation = vi.fn().mockRejectedValue(mockError);
    const { result } = renderHook(() => useAsyncOperation(mockOperation));

    let promise: Promise<any>;
    act(() => {
      promise = result.current.execute();
    });

    expect(result.current.isLoading).toBe(true);

    try {
      await promise!;
    } catch (error) {
      expect(error).toBe(mockError);
    }

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(mockError);
    expect(result.current.data).toBe(null);
  });

  it('should reset state correctly', () => {
    const mockOperation = vi.fn();
    const { result } = renderHook(() => useAsyncOperation(mockOperation));

    // Set some state
    act(() => {
      result.current.execute();
    });

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe(null);
  });
});