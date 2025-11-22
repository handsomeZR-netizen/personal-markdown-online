'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { storageManager, CleanupResult } from '@/lib/offline/storage-manager';
import { ClearDataWarning } from '@/components/offline/clear-data-warning';

interface SmartCleanupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCleanupComplete?: (result: CleanupResult) => void;
}

/**
 * 智能清理对话框
 * 显示清理规则和执行清理操作
 */
export function SmartCleanupDialog({
  open,
  onOpenChange,
  onCleanupComplete,
}: SmartCleanupDialogProps) {
  const [cleaning, setCleaning] = useState(false);
  const [result, setResult] = useState<CleanupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  const handleCleanupClick = () => {
    // 显示警告对话框
    setShowWarning(true);
  };

  const handleConfirmCleanup = async () => {
    setShowWarning(false);
    
    try {
      setCleaning(true);
      setError(null);
      setResult(null);

      const cleanupResult = await storageManager.cleanupCache({
        cleanOldNotes: true,
        cleanExpiredDrafts: true,
        daysOld: 30,
        draftDaysOld: 7,
      });

      setResult(cleanupResult);
      onCleanupComplete?.(cleanupResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : '清理失败');
    } finally {
      setCleaning(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleClose = () => {
    if (!cleaning) {
      onOpenChange(false);
      // 延迟重置状态，避免关闭动画时看到状态变化
      setTimeout(() => {
        setResult(null);
        setError(null);
      }, 300);
    }
  };

  return (
    <>
      <ClearDataWarning
        open={showWarning}
        onOpenChange={setShowWarning}
        onConfirm={handleConfirmCleanup}
      />
      
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>智能缓存清理</DialogTitle>
          <DialogDescription>
            自动清理过期数据，释放存储空间
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 清理规则说明 */}
          {!result && !error && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">清理规则：</p>
                  <ul className="list-disc list-inside space-y-1 text-neutral-600">
                    <li>删除 30 天未访问的笔记缓存</li>
                    <li>仅删除已同步的笔记（保留待同步数据）</li>
                    <li>删除 7 天以上的过期草稿</li>
                    <li>保留最近访问的笔记</li>
                    <li>保留同步队列中的所有数据</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 错误提示 */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 清理结果 */}
          {result && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-green-800">清理完成！</p>
                  <div className="space-y-1 text-green-700">
                    <p>• 删除了 {result.notesDeleted} 个笔记缓存</p>
                    <p>• 删除了 {result.draftsDeleted} 个过期草稿</p>
                    <p>• 释放了约 {formatBytes(result.spaceFreed)} 空间</p>
                  </div>
                  {result.errors.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <p className="text-orange-600 font-medium">部分清理失败：</p>
                      <ul className="list-disc list-inside text-orange-600">
                        {result.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 清理中状态 */}
          {cleaning && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-500 mx-auto" />
                <p className="text-sm text-neutral-600">正在清理缓存...</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {!result ? (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={cleaning}
              >
                取消
              </Button>
              <Button
                onClick={handleCleanupClick}
                disabled={cleaning}
                variant="destructive"
              >
                {cleaning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    清理中...
                  </>
                ) : (
                  '开始清理'
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>完成</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
