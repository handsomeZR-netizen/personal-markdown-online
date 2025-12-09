'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console
    console.error('Error caught by boundary:', error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Log to error tracking service (e.g., Sentry)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error boundary when resetKeys change
    if (
      this.state.hasError &&
      this.props.resetKeys &&
      prevProps.resetKeys &&
      this.props.resetKeys.some((key, index) => key !== prevProps.resetKeys![index])
    ) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetErrorBoundary}
          componentName={this.props.componentName}
        />
      );
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  resetError: () => void;
  componentName?: string;
}

function DefaultErrorFallback({
  error,
  errorInfo,
  resetError,
  componentName,
}: DefaultErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <div className="max-w-2xl w-full">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          {/* Icon and Title */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-2">
                {componentName ? `${componentName} 出错了` : '出错了'}
              </h2>
              <p className="text-red-700 dark:text-red-300 mb-4">
                抱歉，这个组件遇到了一个错误。您可以尝试刷新页面或返回首页。
              </p>

              {/* Error Message */}
              {error && (
                <div className="bg-white dark:bg-gray-900 rounded border border-red-300 dark:border-red-700 p-3 mb-4">
                  <p className="text-sm font-mono text-red-800 dark:text-red-200">
                    {error.message}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={resetError}
                  className="flex items-center gap-2"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4" />
                  重试
                </Button>
                <Button
                  onClick={() => (window.location.href = '/')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  返回首页
                </Button>
              </div>

              {/* Development Details */}
              {isDevelopment && errorInfo && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                    开发者信息（仅开发环境显示）
                  </summary>
                  <div className="bg-white dark:bg-gray-900 rounded border border-red-300 dark:border-red-700 p-3 overflow-auto max-h-64">
                    <pre className="text-xs font-mono text-red-800 dark:text-red-200 whitespace-pre-wrap">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Specialized error boundaries for specific components

export function EditorErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      componentName="编辑器"
      fallback={
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              编辑器加载失败
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              编辑器组件遇到了问题。请刷新页面重试。
            </p>
            <Button onClick={() => window.location.reload()}>
              刷新页面
            </Button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export function FolderTreeErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      componentName="文件夹树"
      fallback={
        <div className="flex items-center justify-center min-h-[200px] p-4">
          <div className="text-center max-w-sm">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              文件夹树加载失败
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              无法显示文件夹结构。请刷新页面重试。
            </p>
            <Button size="sm" onClick={() => window.location.reload()}>
              刷新
            </Button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export function CollaborationErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      componentName="协作功能"
      fallback={
        <div className="flex items-center justify-center min-h-[300px] p-6">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              协作功能暂时不可用
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              实时协作功能遇到了问题。您仍然可以编辑笔记，但无法看到其他用户的实时更新。
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => window.location.reload()}>
                刷新页面
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = '/notes')}
              >
                返回笔记列表
              </Button>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
