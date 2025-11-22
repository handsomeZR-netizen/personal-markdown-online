'use client';

/**
 * Sync Progress Bar Component
 * 
 * Displays sync progress with current/total counts and allows cancellation.
 * Implements Requirement 12.3 from the offline-and-ai-enhancements spec.
 */

import React, { useEffect, useState } from 'react';
import { SyncEngine } from '@/lib/offline/sync-engine';
import { SyncProgress } from '@/types/offline';
import { X, Loader2 } from 'lucide-react';

interface SyncProgressBarProps {
  onClose?: () => void;
}

export function SyncProgressBar({ onClose }: SyncProgressBarProps) {
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const syncEngine = SyncEngine.getInstance();

    // Subscribe to progress updates
    const unsubscribe = syncEngine.onProgress((progressData) => {
      setProgress(progressData);
      setIsVisible(true);
    });

    // Check if sync is already in progress
    if (syncEngine.isSyncInProgress()) {
      setIsVisible(true);
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const handleCancel = () => {
    const syncEngine = SyncEngine.getInstance();
    syncEngine.stopSync();
    setIsVisible(false);
    onClose?.();
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible || !progress) {
    return null;
  }

  const operationTypeText = progress.currentOperation
    ? {
        create: '创建',
        update: '更新',
        delete: '删除',
      }[progress.currentOperation.type]
    : '';

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 rounded-lg border bg-background p-4 shadow-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <h3 className="font-semibold text-sm">正在同步</h3>
        </div>
        <button
          onClick={handleClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="关闭"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>
            {progress.current} / {progress.total}
          </span>
          <span>{Math.round(progress.percentage)}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Current operation */}
      {progress.currentOperation && (
        <div className="text-xs text-muted-foreground mb-3">
          <p className="truncate">
            正在{operationTypeText}笔记：
            {progress.currentOperation.data.title || '无标题'}
          </p>
        </div>
      )}

      {/* Cancel button */}
      <button
        onClick={handleCancel}
        className="w-full text-sm py-2 px-4 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        取消同步
      </button>
    </div>
  );
}
