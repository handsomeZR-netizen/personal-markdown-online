'use client';

import { useState, useEffect } from 'react';
import { Upload, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export interface UploadItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface UploadIndicatorProps {
  uploads: UploadItem[];
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
}

export function UploadIndicator({ uploads, onCancel, onRetry }: UploadIndicatorProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(uploads.length > 0);
  }, [uploads]);

  if (!isVisible) return null;

  const activeUploads = uploads.filter(u => u.status === 'uploading' || u.status === 'pending');
  const completedUploads = uploads.filter(u => u.status === 'success');
  const failedUploads = uploads.filter(u => u.status === 'error');

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          <div className="flex items-center gap-3">
            <Upload className="w-5 h-5 text-blue-500" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                上传文件
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {activeUploads.length > 0
                  ? `正在上传 ${activeUploads.length} 个文件`
                  : `${completedUploads.length} 个文件已完成`}
              </p>
            </div>
          </div>
          <button
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
            }}
          >
            ×
          </button>
        </div>

        {/* Upload list */}
        {!isMinimized && (
          <div className="max-h-96 overflow-y-auto">
            {uploads.map((upload) => (
              <UploadItem
                key={upload.id}
                upload={upload}
                onCancel={onCancel}
                onRetry={onRetry}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UploadItem({
  upload,
  onCancel,
  onRetry,
}: {
  upload: UploadItem;
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
}) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className="flex-shrink-0 mt-1">
          {upload.status === 'uploading' && (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          )}
          {upload.status === 'success' && (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          )}
          {upload.status === 'error' && (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
          {upload.status === 'pending' && (
            <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
          )}
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {upload.name}
            </p>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              {formatFileSize(upload.size)}
            </span>
          </div>

          {/* Progress bar */}
          {(upload.status === 'uploading' || upload.status === 'pending') && (
            <div className="space-y-1">
              <Progress value={upload.progress} className="h-1" />
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{upload.progress}%</span>
                {onCancel && (
                  <button
                    onClick={() => onCancel(upload.id)}
                    className="hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    取消
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Success message */}
          {upload.status === 'success' && (
            <p className="text-xs text-green-600 dark:text-green-400">
              上传成功
            </p>
          )}

          {/* Error message */}
          {upload.status === 'error' && (
            <div className="space-y-1">
              <p className="text-xs text-red-600 dark:text-red-400">
                {upload.error || '上传失败'}
              </p>
              {onRetry && (
                <button
                  onClick={() => onRetry(upload.id)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  重试
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple loading spinner for inline use
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-500`} />
  );
}

// Loading overlay for full-page loading
export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          {message && (
            <p className="text-gray-700 dark:text-gray-300">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline loading state
export function InlineLoading({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <LoadingSpinner />
      {message && (
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      )}
    </div>
  );
}
