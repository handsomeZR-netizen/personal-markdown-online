'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Trash2, AlertTriangle, CheckCircle2, Database, FileText, Folder, History, FileCode, Tag, Users, MessageSquare } from 'lucide-react';
import { storageManager, StorageUsageDetails, CleanupResult } from '@/lib/offline/storage-manager';
import { SmartCleanupDialog } from '@/components/offline/smart-cleanup-dialog';
import type { DatabaseStats } from '@/app/api/storage/stats/route';

export function CacheSettingsComponent() {
  const [loading, setLoading] = useState(true);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [storageUsage, setStorageUsage] = useState<StorageUsageDetails | null>(null);
  const [databaseStats, setDatabaseStats] = useState<DatabaseStats | null>(null);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStorageUsage = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 并行加载本地缓存和数据库统计
      const [usage, dbStatsResponse] = await Promise.all([
        storageManager.getStorageUsage(),
        fetch('/api/storage/stats'),
      ]);
      
      setStorageUsage(usage);
      
      if (dbStatsResponse.ok) {
        const dbStats = await dbStatsResponse.json();
        setDatabaseStats(dbStats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载存储信息失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStorageUsage();
  }, []);

  const handleCleanupComplete = async (result: CleanupResult) => {
    setCleanupResult(result);
    await loadStorageUsage();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {cleanupResult && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">清理完成</AlertTitle>
          <AlertDescription className="text-green-700">
            <div className="space-y-1 mt-2">
              <p>• 删除了 {cleanupResult.notesDeleted} 个笔记缓存</p>
              <p>• 删除了 {cleanupResult.draftsDeleted} 个过期草稿</p>
              <p>• 释放了约 {formatBytes(cleanupResult.spaceFreed)} 空间</p>
              {cleanupResult.errors.length > 0 && (
                <p className="text-orange-600 mt-2">
                  部分清理失败: {cleanupResult.errors.join(', ')}
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {storageUsage && storageUsage.total.isLowSpace && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>存储空间不足</AlertTitle>
          <AlertDescription>
            可用空间小于 50MB，建议清理缓存以释放空间
          </AlertDescription>
        </Alert>
      )}

      {storageUsage && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>存储使用情况</CardTitle>
              <CardDescription>
                已使用 {formatBytes(storageUsage.total.usage)} / 总共 {formatBytes(storageUsage.total.quota)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-600">使用率</span>
                    <span className="font-medium">
                      {storageUsage.total.usagePercentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={storageUsage.total.usagePercentage} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-neutral-600">已使用</p>
                    <p className="text-lg font-semibold text-neutral-800">
                      {formatBytes(storageUsage.total.usage)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">可用</p>
                    <p className="text-lg font-semibold text-neutral-800">
                      {formatBytes(storageUsage.total.available)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">总容量</p>
                    <p className="text-lg font-semibold text-neutral-800">
                      {formatBytes(storageUsage.total.quota)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>数据详情</CardTitle>
              <CardDescription>各类数据的存储占用情况（估算值）</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-800">笔记缓存</p>
                    <p className="text-sm text-neutral-600">
                      {storageUsage.notes.count} 个笔记
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-neutral-800">
                      {formatBytes(storageUsage.notes.estimatedSize)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-800">同步队列</p>
                    <p className="text-sm text-neutral-600">
                      {storageUsage.syncQueue.count} 个待同步操作
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-neutral-800">
                      {formatBytes(storageUsage.syncQueue.estimatedSize)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-800">草稿</p>
                    <p className="text-sm text-neutral-600">
                      {storageUsage.drafts.count} 个草稿
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-neutral-800">
                      {formatBytes(storageUsage.drafts.estimatedSize)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 数据库存储统计 */}
          {databaseStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  数据库存储
                </CardTitle>
                <CardDescription>
                  云端数据库中的数据统计（实时数据）
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* 笔记 */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="font-medium text-neutral-800">笔记</p>
                        <p className="text-sm text-neutral-600">
                          {databaseStats.notes.count} 篇笔记
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-neutral-800">
                        {formatBytes(databaseStats.notes.totalContentSize)}
                      </p>
                    </div>
                  </div>

                  {/* 文件夹 */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Folder className="h-4 w-4 text-yellow-500" />
                      <div>
                        <p className="font-medium text-neutral-800">文件夹</p>
                        <p className="text-sm text-neutral-600">
                          {databaseStats.folders.count} 个文件夹
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 版本历史 */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <History className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="font-medium text-neutral-800">版本历史</p>
                        <p className="text-sm text-neutral-600">
                          {databaseStats.versions.count} 个版本
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-neutral-800">
                        {formatBytes(databaseStats.versions.totalContentSize)}
                      </p>
                    </div>
                  </div>

                  {/* 模板 */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileCode className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="font-medium text-neutral-800">模板</p>
                        <p className="text-sm text-neutral-600">
                          {databaseStats.templates.count} 个模板
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 标签 */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Tag className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="font-medium text-neutral-800">标签</p>
                        <p className="text-sm text-neutral-600">
                          {databaseStats.tags.count} 个标签
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 协作 */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-cyan-500" />
                      <div>
                        <p className="font-medium text-neutral-800">协作</p>
                        <p className="text-sm text-neutral-600">
                          {databaseStats.collaborations.count} 个协作笔记
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AI 对话 */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4 text-pink-500" />
                      <div>
                        <p className="font-medium text-neutral-800">AI 对话</p>
                        <p className="text-sm text-neutral-600">
                          {databaseStats.aiConversations.count} 个对话，{databaseStats.aiConversations.messagesCount} 条消息
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 总计 */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-neutral-800">数据库总占用（估算）</span>
                      <span className="text-lg font-semibold text-neutral-800">
                        {formatBytes(databaseStats.total.estimatedSize)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>清理缓存</CardTitle>
              <CardDescription>
                清理 30 天未访问的笔记缓存和过期草稿（保留待同步数据）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-neutral-50 p-4 rounded-lg space-y-2 text-sm">
                  <p className="font-medium text-neutral-800">清理规则：</p>
                  <ul className="list-disc list-inside space-y-1 text-neutral-600">
                    <li>删除 30 天未访问的笔记缓存（仅已同步的笔记）</li>
                    <li>删除 7 天以上的过期草稿</li>
                    <li>保留同步队列中的所有待同步数据</li>
                    <li>保留最近访问的笔记</li>
                  </ul>
                </div>

                <Button
                  onClick={() => setShowCleanupDialog(true)}
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  清理缓存
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <SmartCleanupDialog
        open={showCleanupDialog}
        onOpenChange={setShowCleanupDialog}
        onCleanupComplete={handleCleanupComplete}
      />
    </div>
  );
}
