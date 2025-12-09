'use client';

/**
 * Storage Manager Component
 * Displays storage usage with breakdown and progress bar
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Database, FileText, Image } from 'lucide-react';
import { formatBytes } from '@/lib/storage/storage-quota-manager';

interface StorageUsage {
  totalBytes: number;
  notesBytes: number;
  imagesBytes: number;
  quotaBytes: number;
  usagePercentage: number;
}

interface StorageBreakdown {
  type: 'notes' | 'images';
  bytes: number;
  count: number;
}

export function StorageManager() {
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [breakdown, setBreakdown] = useState<StorageBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStorageData();
  }, []);

  const loadStorageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch storage usage and breakdown
      const [usageRes, breakdownRes] = await Promise.all([
        fetch('/api/storage/quota'),
        fetch('/api/storage/breakdown'),
      ]);

      if (!usageRes.ok || !breakdownRes.ok) {
        throw new Error('Failed to load storage data');
      }

      const usageData = await usageRes.json();
      const breakdownData = await breakdownRes.json();

      setUsage(usageData);
      setBreakdown(breakdownData);
    } catch (err) {
      console.error('Error loading storage data:', err);
      setError('无法加载存储数据');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            存储空间
          </CardTitle>
          <CardDescription>加载中...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-20 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !usage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            存储空间
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error || '无法加载存储数据'}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const isNearQuota = usage.usagePercentage >= 80;
  const isQuotaExceeded = usage.usagePercentage >= 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          存储空间
        </CardTitle>
        <CardDescription>
          已使用 {formatBytes(usage.totalBytes)} / {formatBytes(usage.quotaBytes)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Warning Alert */}
        {isQuotaExceeded && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              存储空间已满！请删除一些内容以释放空间。
            </AlertDescription>
          </Alert>
        )}
        {isNearQuota && !isQuotaExceeded && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              存储空间使用率已达 {usage.usagePercentage.toFixed(1)}%，建议清理不需要的内容。
            </AlertDescription>
          </Alert>
        )}

        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">总使用率</span>
            <span className="font-medium">
              {usage.usagePercentage.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={usage.usagePercentage} 
            className="h-3"
            indicatorClassName={
              isQuotaExceeded 
                ? 'bg-red-500' 
                : isNearQuota 
                ? 'bg-yellow-500' 
                : 'bg-blue-500'
            }
          />
        </div>

        {/* Storage Breakdown */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">存储明细</h3>
          
          {breakdown.map((item) => {
            const percentage = (item.bytes / usage.quotaBytes) * 100;
            const Icon = item.type === 'notes' ? FileText : Image;
            const label = item.type === 'notes' ? '笔记内容' : '图片文件';

            return (
              <div key={item.type} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{label}</span>
                    <span className="text-muted-foreground">
                      ({item.count} 项)
                    </span>
                  </div>
                  <span className="font-medium">
                    {formatBytes(item.bytes)}
                  </span>
                </div>
                <Progress 
                  value={percentage} 
                  className="h-2"
                  indicatorClassName={
                    item.type === 'notes' ? 'bg-green-500' : 'bg-purple-500'
                  }
                />
                <div className="text-xs text-muted-foreground text-right">
                  {percentage.toFixed(1)}% of total
                </div>
              </div>
            );
          })}
        </div>

        {/* Available Space */}
        <div className="pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">可用空间</span>
            <span className="font-medium">
              {formatBytes(usage.quotaBytes - usage.totalBytes)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
