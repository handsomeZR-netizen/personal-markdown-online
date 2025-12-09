'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { LoadingOverlay, LoaderVariant } from '@/components/ui/creative-loader';
import { AnimatePresence } from 'framer-motion';

interface LoadingState {
  isLoading: boolean;
  message?: string;
  variant?: LoaderVariant;
}

interface LoadingContextType {
  showLoading: (message?: string, variant?: LoaderVariant) => void;
  hideLoading: () => void;
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
  });

  const showLoading = useCallback((message?: string, variant: LoaderVariant = 'orbit') => {
    setLoadingState({ isLoading: true, message, variant });
  }, []);

  const hideLoading = useCallback(() => {
    setLoadingState({ isLoading: false });
  }, []);

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading, isLoading: loadingState.isLoading }}>
      {children}
      <AnimatePresence>
        {loadingState.isLoading && (
          <LoadingOverlay
            variant={loadingState.variant}
            message={loadingState.message}
          />
        )}
      </AnimatePresence>
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
}

// 便捷的异步操作包装器
export function useLoadingAction() {
  const { showLoading, hideLoading } = useLoading();

  const withLoading = useCallback(
    async <T,>(
      action: () => Promise<T>,
      message?: string,
      variant?: LoaderVariant
    ): Promise<T> => {
      try {
        showLoading(message, variant);
        const result = await action();
        return result;
      } finally {
        hideLoading();
      }
    },
    [showLoading, hideLoading]
  );

  return { withLoading };
}
