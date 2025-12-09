/**
 * 加载状态管理辅助函数
 */

/**
 * 确保最小加载时间，避免闪烁
 */
export async function withMinLoadingTime<T>(
  promise: Promise<T>,
  minTime: number = 300
): Promise<T> {
  const startTime = Date.now();
  const result = await promise;
  const elapsed = Date.now() - startTime;
  
  if (elapsed < minTime) {
    await new Promise(resolve => setTimeout(resolve, minTime - elapsed));
  }
  
  return result;
}

/**
 * 带超时的加载
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = '操作超时'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ]);
}

/**
 * 重试机制
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }
  
  throw lastError!;
}

/**
 * 批量操作进度跟踪
 */
export async function withProgress<T>(
  items: T[],
  processor: (item: T, index: number) => Promise<void>,
  onProgress?: (current: number, total: number, percentage: number) => void
): Promise<void> {
  const total = items.length;
  
  for (let i = 0; i < total; i++) {
    await processor(items[i], i);
    const percentage = Math.round(((i + 1) / total) * 100);
    onProgress?.(i + 1, total, percentage);
  }
}

/**
 * 防抖加载
 */
export function debounceLoading<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delayMs: number = 300
): T {
  let timeoutId: NodeJS.Timeout | null = null;
  let isLoading = false;
  
  return (async (...args: Parameters<T>) => {
    if (isLoading) return;
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        isLoading = true;
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          isLoading = false;
        }
      }, delayMs);
    });
  }) as T;
}

/**
 * 节流加载
 */
export function throttleLoading<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  limitMs: number = 1000
): T {
  let isLoading = false;
  let lastCallTime = 0;
  
  return (async (...args: Parameters<T>) => {
    const now = Date.now();
    
    if (isLoading || now - lastCallTime < limitMs) {
      return;
    }
    
    isLoading = true;
    lastCallTime = now;
    
    try {
      return await fn(...args);
    } finally {
      isLoading = false;
    }
  }) as T;
}

/**
 * 并发控制
 */
export async function withConcurrencyLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number = 3
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];
  
  for (const task of tasks) {
    const promise = task().then(result => {
      results.push(result);
    });
    
    executing.push(promise);
    
    if (executing.length >= limit) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex(p => p === promise),
        1
      );
    }
  }
  
  await Promise.all(executing);
  return results;
}

/**
 * 加载状态管理类
 */
export class LoadingStateManager {
  private loadingStates = new Map<string, boolean>();
  private listeners = new Set<(states: Map<string, boolean>) => void>();

  setLoading(key: string, loading: boolean) {
    this.loadingStates.set(key, loading);
    this.notifyListeners();
  }

  isLoading(key: string): boolean {
    return this.loadingStates.get(key) ?? false;
  }

  isAnyLoading(): boolean {
    return Array.from(this.loadingStates.values()).some(loading => loading);
  }

  subscribe(listener: (states: Map<string, boolean>) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(new Map(this.loadingStates)));
  }

  async withLoading<T>(key: string, fn: () => Promise<T>): Promise<T> {
    this.setLoading(key, true);
    try {
      return await fn();
    } finally {
      this.setLoading(key, false);
    }
  }
}

/**
 * 创建加载状态管理器实例
 */
export function createLoadingManager() {
  return new LoadingStateManager();
}

/**
 * 智能加载：根据操作时间自动选择策略
 */
export async function smartLoading<T>(
  fn: () => Promise<T>,
  options: {
    minTime?: number;
    maxTime?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onTimeout?: () => void;
  } = {}
): Promise<T> {
  const {
    minTime = 300,
    maxTime = 30000,
    onStart,
    onEnd,
    onTimeout,
  } = options;

  const startTime = Date.now();
  onStart?.();

  try {
    const result = await withTimeout(fn(), maxTime);
    const elapsed = Date.now() - startTime;

    // 如果操作太快，等待最小时间避免闪烁
    if (elapsed < minTime) {
      await new Promise(resolve => setTimeout(resolve, minTime - elapsed));
    }

    return result;
  } catch (error) {
    if ((error as Error).message.includes('超时')) {
      onTimeout?.();
    }
    throw error;
  } finally {
    onEnd?.();
  }
}

/**
 * 缓存加载结果
 */
export function createCachedLoader<T>(
  loader: () => Promise<T>,
  cacheTime: number = 5 * 60 * 1000 // 5分钟
) {
  let cache: { data: T; timestamp: number } | null = null;
  let loading: Promise<T> | null = null;

  return async (): Promise<T> => {
    // 如果有缓存且未过期，返回缓存
    if (cache && Date.now() - cache.timestamp < cacheTime) {
      return cache.data;
    }

    // 如果正在加载，返回加载中的 Promise
    if (loading) {
      return loading;
    }

    // 开始新的加载
    loading = loader();
    
    try {
      const data = await loading;
      cache = { data, timestamp: Date.now() };
      return data;
    } finally {
      loading = null;
    }
  };
}
