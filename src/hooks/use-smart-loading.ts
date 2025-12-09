'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  withMinLoadingTime,
  withTimeout,
  withRetry,
  smartLoading,
  LoadingStateManager,
} from '@/lib/utils/loading-helpers';

/**
 * 智能加载 Hook
 * 自动处理最小加载时间、超时、重试等
 */
export function useSmartLoading<T = void>(options: {
  minTime?: number;
  maxTime?: number;
  retries?: number;
  retryDelay?: number;
} = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(
    async (fn: () => Promise<T>) => {
      setLoading(true);
      setError(null);

      try {
        let result: T;

        if (options.retries && options.retries > 1) {
          result = await withRetry(fn, options.retries, options.retryDelay);
        } else {
          result = await smartLoading(fn, {
            minTime: options.minTime,
            maxTime: options.maxTime,
          });
        }

        setData(result);
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options.minTime, options.maxTime, options.retries, options.retryDelay]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset,
  };
}

/**
 * 多个加载状态管理 Hook
 */
export function useLoadingStates() {
  const managerRef = useRef<LoadingStateManager>();
  const [states, setStates] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = new LoadingStateManager();
    }

    const unsubscribe = managerRef.current.subscribe(setStates);
    return unsubscribe;
  }, []);

  const setLoading = useCallback((key: string, loading: boolean) => {
    managerRef.current?.setLoading(key, loading);
  }, []);

  const isLoading = useCallback((key: string) => {
    return managerRef.current?.isLoading(key) ?? false;
  }, []);

  const isAnyLoading = useCallback(() => {
    return managerRef.current?.isAnyLoading() ?? false;
  }, []);

  const withLoading = useCallback(
    async <T,>(key: string, fn: () => Promise<T>) => {
      return managerRef.current?.withLoading(key, fn);
    },
    []
  );

  return {
    states,
    setLoading,
    isLoading,
    isAnyLoading,
    withLoading,
  };
}

/**
 * 防抖加载 Hook
 */
export function useDebouncedLoading<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number = 300
) {
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedFn = useCallback(
    async (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      return new Promise<Awaited<ReturnType<T>>>((resolve, reject) => {
        timeoutRef.current = setTimeout(async () => {
          setLoading(true);
          try {
            const result = await fn(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            setLoading(false);
          }
        }, delay);
      });
    },
    [fn, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { loading, execute: debouncedFn };
}

/**
 * 批量操作进度 Hook
 */
export function useBatchProgress<T>() {
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    percentage: 0,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Error[]>([]);

  const execute = useCallback(
    async (
      items: T[],
      processor: (item: T, index: number) => Promise<void>
    ) => {
      setLoading(true);
      setErrors([]);
      setProgress({ current: 0, total: items.length, percentage: 0 });

      const newErrors: Error[] = [];

      for (let i = 0; i < items.length; i++) {
        try {
          await processor(items[i], i);
        } catch (error) {
          newErrors.push(error as Error);
        }

        const current = i + 1;
        const percentage = Math.round((current / items.length) * 100);
        setProgress({ current, total: items.length, percentage });
      }

      setErrors(newErrors);
      setLoading(false);
    },
    []
  );

  const reset = useCallback(() => {
    setProgress({ current: 0, total: 0, percentage: 0 });
    setLoading(false);
    setErrors([]);
  }, []);

  return {
    progress,
    loading,
    errors,
    execute,
    reset,
  };
}

/**
 * 自动重试 Hook
 */
export function useAutoRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    shouldRetry?: (error: Error) => boolean;
  } = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [data, setData] = useState<T | null>(null);

  const {
    maxRetries = 3,
    retryDelay = 1000,
    shouldRetry = () => true,
  } = options;

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRetryCount(0);

    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await fn();
        setData(result);
        setLoading(false);
        return result;
      } catch (err) {
        lastError = err as Error;
        setRetryCount(i + 1);

        if (!shouldRetry(lastError) || i === maxRetries - 1) {
          break;
        }

        await new Promise(resolve =>
          setTimeout(resolve, retryDelay * (i + 1))
        );
      }
    }

    setError(lastError);
    setLoading(false);
    throw lastError;
  }, [fn, maxRetries, retryDelay, shouldRetry]);

  return {
    loading,
    error,
    data,
    retryCount,
    execute,
  };
}

/**
 * 轮询加载 Hook
 */
export function usePolling<T>(
  fn: () => Promise<T>,
  interval: number = 5000,
  options: {
    immediate?: boolean;
    enabled?: boolean;
  } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  const { immediate = true, enabled = true } = options;

  const poll = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    try {
      const result = await fn();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [fn, enabled]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    if (immediate) {
      poll();
    }

    intervalRef.current = setInterval(poll, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [poll, interval, immediate, enabled]);

  return {
    data,
    loading,
    error,
    refetch: poll,
  };
}
