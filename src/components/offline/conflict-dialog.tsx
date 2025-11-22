/**
 * 冲突对比对话框组件
 * 并排显示本地版本和服务器版本，高亮显示差异部分
 */

'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LocalNote, ConflictStrategy } from '@/types/offline';
import { RemoteNote } from '@/lib/offline/conflict-resolver';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

/**
 * 冲突对话框属性
 */
interface ConflictDialogProps {
  open: boolean;
  local: LocalNote;
  remote: RemoteNote;
  onResolve: (strategy: ConflictStrategy, mergedData?: Partial<LocalNote>) => void;
  onCancel: () => void;
}

/**
 * 冲突对话框组件
 */
export function ConflictDialog({
  open,
  local,
  remote,
  onResolve,
  onCancel,
}: ConflictDialogProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<ConflictStrategy | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  // 计算差异字段
  const differences = useMemo(() => {
    const diffs: string[] = [];

    if (local.title !== remote.title) diffs.push('title');
    if (local.content !== remote.content) diffs.push('content');
    if (local.summary !== remote.summary) diffs.push('summary');
    if (local.categoryId !== remote.categoryId) diffs.push('categoryId');

    const localTags = JSON.stringify(local.tags?.sort() || []);
    const remoteTags = JSON.stringify(remote.tags?.map((t) => t.id).sort() || []);
    if (localTags !== remoteTags) diffs.push('tags');

    return diffs;
  }, [local, remote]);

  // 格式化时间
  const formatTime = (timestamp: number | Date | string) => {
    const date = typeof timestamp === 'number' 
      ? new Date(timestamp) 
      : new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 处理解决冲突
  const handleResolve = async (strategy: ConflictStrategy) => {
    setIsResolving(true);
    try {
      onResolve(strategy);
    } finally {
      setIsResolving(false);
    }
  };

  // 高亮差异文本
  const highlightDifferences = (text: string, isDifferent: boolean) => {
    if (!isDifferent) return text;
    return text;
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            检测到冲突
          </DialogTitle>
          <DialogDescription>
            本地版本和服务器版本存在差异，请选择如何解决此冲突。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 冲突信息摘要 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">冲突摘要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">本地更新时间:</span>
                <span className="font-medium">{formatTime(local.updatedAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">服务器更新时间:</span>
                <span className="font-medium">{formatTime(remote.updatedAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="text-muted-foreground">冲突字段:</span>
                {differences.map((field) => (
                  <Badge key={field} variant="destructive">
                    {field}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 版本对比 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 本地版本 */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  本地版本
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">标题</div>
                  <div
                    className={`text-sm p-2 rounded ${
                      differences.includes('title')
                        ? 'bg-yellow-100 border border-yellow-300'
                        : 'bg-white'
                    }`}
                  >
                    {local.title}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">内容</div>
                  <div
                    className={`text-sm p-2 rounded max-h-40 overflow-y-auto ${
                      differences.includes('content')
                        ? 'bg-yellow-100 border border-yellow-300'
                        : 'bg-white'
                    }`}
                  >
                    {local.content || '(空)'}
                  </div>
                </div>

                {local.summary && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">摘要</div>
                    <div
                      className={`text-sm p-2 rounded ${
                        differences.includes('summary')
                          ? 'bg-yellow-100 border border-yellow-300'
                          : 'bg-white'
                      }`}
                    >
                      {local.summary}
                    </div>
                  </div>
                )}

                {local.tags && local.tags.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">标签</div>
                    <div
                      className={`flex flex-wrap gap-1 p-2 rounded ${
                        differences.includes('tags')
                          ? 'bg-yellow-100 border border-yellow-300'
                          : 'bg-white'
                      }`}
                    >
                      {local.tags.map((tagId) => (
                        <Badge key={tagId} variant="secondary">
                          {tagId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 服务器版本 */}
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  服务器版本
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">标题</div>
                  <div
                    className={`text-sm p-2 rounded ${
                      differences.includes('title')
                        ? 'bg-yellow-100 border border-yellow-300'
                        : 'bg-white'
                    }`}
                  >
                    {remote.title}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">内容</div>
                  <div
                    className={`text-sm p-2 rounded max-h-40 overflow-y-auto ${
                      differences.includes('content')
                        ? 'bg-yellow-100 border border-yellow-300'
                        : 'bg-white'
                    }`}
                  >
                    {remote.content || '(空)'}
                  </div>
                </div>

                {remote.summary && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">摘要</div>
                    <div
                      className={`text-sm p-2 rounded ${
                        differences.includes('summary')
                          ? 'bg-yellow-100 border border-yellow-300'
                          : 'bg-white'
                      }`}
                    >
                      {remote.summary}
                    </div>
                  </div>
                )}

                {remote.tags && remote.tags.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">标签</div>
                    <div
                      className={`flex flex-wrap gap-1 p-2 rounded ${
                        differences.includes('tags')
                          ? 'bg-yellow-100 border border-yellow-300'
                          : 'bg-white'
                      }`}
                    >
                      {remote.tags.map((tag) => (
                        <Badge key={tag.id} variant="secondary">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isResolving}
          >
            取消
          </Button>
          <Button
            variant="default"
            className="bg-blue-500 hover:bg-blue-600"
            onClick={() => handleResolve('use-local')}
            disabled={isResolving}
          >
            保留本地版本
          </Button>
          <Button
            variant="default"
            className="bg-green-500 hover:bg-green-600"
            onClick={() => handleResolve('use-remote')}
            disabled={isResolving}
          >
            使用服务器版本
          </Button>
          <Button
            variant="default"
            className="bg-purple-500 hover:bg-purple-600"
            onClick={() => handleResolve('manual-merge')}
            disabled={isResolving}
            title="手动合并功能即将推出"
          >
            手动合并
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
