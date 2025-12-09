'use client';

/**
 * Storage Warning Banner Component
 * Displays warning when storage usage is high
 */

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface StorageWarningBannerProps {
  onDismiss?: () => void;
}

export function StorageWarningBanner({ onDismiss }: StorageWarningBannerProps) {
  const [usage, setUsage] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStorageUsage();
  }, []);

  const checkStorageUsage = async () => {
    try {
      const response = await fetch('/api/storage/quota');
      if (response.ok) {
        const data = await response.json();
        setUsage(data.usagePercentage);
      }
    } catch (error) {
      console.error('Error checking storage usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  // Don't show if loading, dismissed, or usage is below 80%
  if (loading || dismissed || usage === null || usage < 80) {
    return null;
  }

  const isQuotaExceeded = usage >= 100;

  return (
    <Alert 
      variant={isQuotaExceeded ? 'destructive' : 'default'}
      className="mb-4"
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        {isQuotaExceeded ? '存储空间已满' : '存储空间不足'}
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>
          {isQuotaExceeded
            ? '您的存储空间已用完，无法上传新内容。请删除一些文件以释放空间。'
            : `您的存储空间使用率已达 ${usage.toFixed(1)}%，建议清理不需要的内容。`}
        </span>
        <div className="flex items-center gap-2 ml-4">
          <Link href="/settings/storage">
            <Button variant="outline" size="sm">
              管理存储
            </Button>
          </Link>
          {!isQuotaExceeded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
