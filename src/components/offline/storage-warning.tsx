'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';
import Link from 'next/link';
import { storageManager } from '@/lib/offline/storage-manager';

/**
 * 存储空间警告组件
 * 在应用启动时检测存储空间，如果可用空间小于 50MB 则显示警告
 */
export function StorageWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [availableSpace, setAvailableSpace] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStorage();
  }, []);

  const checkStorage = async () => {
    try {
      setLoading(true);
      const quota = await storageManager.checkStorageQuota();

      if (quota.isLowSpace) {
        setShowWarning(true);
        setAvailableSpace(formatBytes(quota.available));
      }
    } catch (error) {
      console.error('检测存储空间失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleDismiss = () => {
    setShowWarning(false);
    // 保存到 localStorage，24 小时内不再显示
    localStorage.setItem('storage-warning-dismissed', Date.now().toString());
  };

  // 检查是否在 24 小时内已经关闭过警告
  useEffect(() => {
    const dismissed = localStorage.getItem('storage-warning-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const now = Date.now();
      const hoursSinceDismissed = (now - dismissedTime) / (1000 * 60 * 60);
      
      if (hoursSinceDismissed < 24) {
        setShowWarning(false);
      }
    }
  }, []);

  if (loading || !showWarning) {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-2xl px-4">
      <Alert variant="destructive" className="shadow-lg">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between">
          <span>存储空间不足</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertTitle>
        <AlertDescription>
          <p className="mb-3">
            可用存储空间仅剩 {availableSpace}，建议清理缓存以释放空间。
          </p>
          <div className="flex gap-2">
            <Link href="/settings/cache">
              <Button variant="outline" size="sm" className="bg-white">
                前往清理
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              稍后提醒
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
