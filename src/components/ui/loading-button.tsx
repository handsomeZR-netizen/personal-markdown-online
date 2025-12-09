'use client';

import { ButtonHTMLAttributes, forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { ButtonLoader, LoaderVariant } from './creative-loader';

export interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loaderVariant?: LoaderVariant;
  loadingText?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      className,
      children,
      loading = false,
      loaderVariant = 'dots',
      loadingText,
      variant = 'default',
      size = 'default',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-gray-300';
    
    const variants = {
      default: 'bg-gray-900 text-gray-50 shadow hover:bg-gray-900/90 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90',
      destructive: 'bg-red-500 text-gray-50 shadow-sm hover:bg-red-500/90 dark:bg-red-900 dark:text-gray-50 dark:hover:bg-red-900/90',
      outline: 'border border-gray-200 bg-white shadow-sm hover:bg-gray-100 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50',
      secondary: 'bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-100/80 dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-800/80',
      ghost: 'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-50',
      link: 'text-gray-900 underline-offset-4 hover:underline dark:text-gray-50',
    };

    const sizes = {
      default: 'h-9 px-4 py-2',
      sm: 'h-8 rounded-md px-3 text-xs',
      lg: 'h-10 rounded-md px-8',
      icon: 'h-9 w-9',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          loading && 'cursor-wait',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <ButtonLoader variant={loaderVariant} size="sm" />
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';

export { LoadingButton };

// 带自动加载状态的异步按钮
export function AsyncButton({
  onClick,
  children,
  onSuccess,
  onError,
  successMessage,
  errorMessage,
  ...props
}: LoadingButtonProps & {
  onClick?: () => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!onClick) return;

    try {
      setLoading(true);
      await onClick();
      onSuccess?.();
      if (successMessage) {
        // 可以集成 toast 通知
        console.log(successMessage);
      }
    } catch (error) {
      onError?.(error as Error);
      if (errorMessage) {
        console.error(errorMessage, error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoadingButton {...props} loading={loading} onClick={handleClick}>
      {children}
    </LoadingButton>
  );
}
