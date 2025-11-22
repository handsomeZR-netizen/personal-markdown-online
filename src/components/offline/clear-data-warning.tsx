'use client';

import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Cloud } from 'lucide-react';
import { syncQueueManager } from '@/lib/offline/sync-queue-manager';
import { syncEngine } from '@/lib/offline/sync-engine';
import { toast } from 'sonner';

interface ClearDataWarningProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ClearDataWarning({ open, onOpenChange, onConfirm }: ClearDataWarningProps) {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (open) {
      loadPendingCount();
    }
  }, [open]);

  const loadPendingCount = async () => {
    try {
      const queue = await syncQueueManager.getQueue();
      const pending = queue.filter(op => op.status === 'pending' || op.status === 'failed').length;
      setPendingCount(pending);
    } catch (error) {
      console.error('获取待同步操作数量失败:', error);
    }
  };

  const handleSyncAndClear = async () => {
    setIsSyncing(true);
    try {
      const result = await syncEngine.startSync();
      
      if (result.failed > 0) {
        toast.error(`同步失败 ${result.failed} 个操作`, {
          description: '请检查网络连接后重试',
        });
        setIsSyncing(false);
        return;
      }

      toast.success('同步完成，可以安全清除数据');
      onConfirm();
    } catch (error) {
      console.error('同步失败:', error);
      toast.error('同步失败', {
        description: '请稍后重试或选择强制清除',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>清除数据警告</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <p>
              您即将清除浏览器中的本地数据。
              {pendingCount > 0 && (
                <span className="font-semibold text-destructive">
                  {' '}当前有 {pendingCount} 个操作尚未同步到服务器。
                </span>
              )}
            </p>
            
            {pendingCount > 0 && (
              <div className="bg-muted p-3 rounded-md">
                <div className="flex items-start gap-2">
                  <Cloud className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-medium">未同步的数据包括：</p>
                    <ul className="list-disc list-inside mt-1 text-muted-foreground">
                      <li>离线创建或编辑的笔记</li>
                      <li>待删除的笔记</li>
                      <li>其他待同步的更改</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <p className="text-sm">
              {pendingCount > 0 
                ? '建议先同步数据再清除，以避免数据丢失。'
                : '清除后，所有本地缓存的笔记将被删除，但已同步的数据不会受影响。'
              }
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          
          {pendingCount > 0 && (
            <Button
              onClick={handleSyncAndClear}
              disabled={isSyncing}
              variant="default"
            >
              {isSyncing ? '同步中...' : '先同步再清除'}
            </Button>
          )}
          
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {pendingCount > 0 ? '强制清除' : '确认清除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
