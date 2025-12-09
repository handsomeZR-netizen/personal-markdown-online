'use client';

import { ComponentType, useState } from 'react';
import { CreativeLoader, LoaderVariant } from './creative-loader';
import { cn } from '@/lib/utils';

interface WithLoadingOptions {
  variant?: LoaderVariant;
  message?: string;
  fullScreen?: boolean;
  minLoadingTime?: number; // 最小加载时间（毫秒），避免闪烁
}

/**
 * 高阶组件：为任何组件添加加载状态
 */
export function withLoading<P extends object>(
  Component: ComponentType<P>,
  options: WithLoadingOptions = {}
) {
  return function WithLoadingComponent(
    props: P & { isLoading?: boolean; loadingMessage?: string }
  ) {
    const {
      variant = 'orbit',
      message = '加载中...',
      fullScreen = false,
      minLoadingTime = 300,
    } = options;

    const { isLoading, loadingMessage, ...componentProps } = props;
    const [showLoading, setShowLoading] = useState(false);

    // 处理最小加载时间，避免闪烁
    useState(() => {
      if (isLoading) {
        setShowLoading(true);
      } else {
        const timer = setTimeout(() => {
          setShowLoading(false);
        }, minLoadingTime);
        return () => clearTimeout(timer);
      }
    });

    if (showLoading || isLoading) {
      if (fullScreen) {
        return (
          <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
            <CreativeLoader
              variant={variant}
              size="lg"
              message={loadingMessage || message}
            />
          </div>
        );
      }

      return (
        <div className="flex items-center justify-center p-8">
          <CreativeLoader
            variant={variant}
            size="md"
            message={loadingMessage || message}
          />
        </div>
      );
    }

    return <Component {...(componentProps as P)} />;
  };
}

/**
 * 加载容器组件：包装子组件并显示加载状态
 */
export function LoadingContainer({
  isLoading,
  children,
  variant = 'orbit',
  message,
  className,
  overlay = false,
}: {
  isLoading: boolean;
  children: React.ReactNode;
  variant?: LoaderVariant;
  message?: string;
  className?: string;
  overlay?: boolean;
}) {
  if (!isLoading) {
    return <>{children}</>;
  }

  if (overlay) {
    return (
      <div className={cn('relative', className)}>
        {children}
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10">
          <CreativeLoader variant={variant} size="md" message={message} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <CreativeLoader variant={variant} size="md" message={message} />
    </div>
  );
}

/**
 * 内联加载指示器
 */
export function InlineLoader({
  variant = 'dots',
  message,
  className,
}: {
  variant?: LoaderVariant;
  message?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <CreativeLoader variant={variant} size="sm" />
      {message && (
        <span className="text-sm text-gray-600 dark:text-gray-400">{message}</span>
      )}
    </div>
  );
}
