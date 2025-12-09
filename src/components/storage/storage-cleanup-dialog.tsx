'use client';

/**
 * Storage Cleanup Dialog Component
 * Lists large files and old notes for cleanup
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Image, Trash2, AlertTriangle } from 'lucide-react';
import { formatBytes } from '@/lib/storage/storage-quota-manager';
import { toast } from 'sonner';

interface LargeItem {
  id: string;
  type: 'note' | 'image';
  name: string;
  size: number;
  createdAt: Date;
  path?: string;
}

interface StorageCleanupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCleanupComplete?: () => void;
}

export function StorageCleanupDialog({
  open,
  onOpenChange,
  onCleanupComplete,
}: StorageCleanupDialogProps) {
  const [largeItems, setLargeItems] = useState<LargeItem[]>([]);
  const [oldItems, setOldItems] = useState<LargeItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'large' | 'old'>('large');

  useEffect(() => {
    if (open) {
      loadItems();
    }
  }, [open]);

  const loadItems = async () => {
    try {
      setLoading(true);

      const [largeRes, oldRes] = await Promise.all([
        fetch('/api/storage/large-items?type=large&limit=50'),
        fetch('/api/storage/large-items?type=old&daysOld=90&limit=50'),
      ]);

      if (largeRes.ok && oldRes.ok) {
        const largeData = await largeRes.json();
        const oldData = await oldRes.json();

        setLargeItems(largeData);
        setOldItems(oldData);
      }
    } catch (error) {
      console.error('Error loading items:', error);
      toast.error('无法加载清理项目');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = (items: LargeItem[]) => {
    const newSelected = new Set(selectedItems);
    const allSelected = items.every((item) => newSelected.has(item.id));

    if (allSelected) {
      // Deselect all
      items.forEach((item) => newSelected.delete(item.id));
    } else {
      // Select all
      items.forEach((item) => newSelected.add(item.id));
    }

    setSelectedItems(newSelected);
  };

  const calculateTotalSize = () => {
    const allItems = [...largeItems, ...oldItems];
    return allItems
      .filter((item) => selectedItems.has(item.id))
      .reduce((total, item) => total + item.size, 0);
  };

  const handleCleanup = async () => {
    if (selectedItems.size === 0) {
      toast.error('请选择要删除的项目');
      return;
    }

    try {
      setDeleting(true);

      const allItems = [...largeItems, ...oldItems];
      const itemsToDelete = allItems.filter((item) =>
        selectedItems.has(item.id)
      );

      // Separate notes and images
      const notesToDelete = itemsToDelete
        .filter((item) => item.type === 'note')
        .map((item) => item.id);
      const imagesToDelete = itemsToDelete
        .filter((item) => item.type === 'image')
        .map((item) => item.path);

      // Delete items
      const deletePromises = [];

      if (notesToDelete.length > 0) {
        deletePromises.push(
          fetch('/api/storage/cleanup', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ noteIds: notesToDelete }),
          })
        );
      }

      if (imagesToDelete.length > 0) {
        deletePromises.push(
          fetch('/api/storage/cleanup', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imagePaths: imagesToDelete }),
          })
        );
      }

      await Promise.all(deletePromises);

      toast.success(`成功删除 ${selectedItems.size} 个项目`);
      setSelectedItems(new Set());
      onCleanupComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error cleaning up:', error);
      toast.error('清理失败，请重试');
    } finally {
      setDeleting(false);
    }
  };

  const renderItemList = (items: LargeItem[]) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          没有找到可清理的项目
        </div>
      );
    }

    const allSelected = items.every((item) => selectedItems.has(item.id));

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Checkbox
            checked={allSelected}
            onCheckedChange={() => handleSelectAll(items)}
          />
          <span className="text-sm font-medium">全选</span>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-2 pr-4">
            {items.map((item) => {
              const Icon = item.type === 'note' ? FileText : Image;
              const isSelected = selectedItems.has(item.id);

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer"
                  onClick={() => handleToggleItem(item.id)}
                >
                  <Checkbox checked={isSelected} />
                  <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-right">
                    {formatBytes(item.size)}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  };

  const totalSize = calculateTotalSize();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>清理存储空间</DialogTitle>
          <DialogDescription>
            选择要删除的笔记和图片以释放存储空间
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            加载中...
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'large' | 'old')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="large">
                  大文件 ({largeItems.length})
                </TabsTrigger>
                <TabsTrigger value="old">
                  旧内容 ({oldItems.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="large" className="mt-4">
                {renderItemList(largeItems)}
              </TabsContent>

              <TabsContent value="old" className="mt-4">
                {renderItemList(oldItems)}
              </TabsContent>
            </Tabs>

            {selectedItems.size > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  将删除 {selectedItems.size} 个项目，释放约{' '}
                  {formatBytes(totalSize)} 空间。此操作不可撤销。
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleCleanup}
            disabled={selectedItems.size === 0 || deleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleting ? '删除中...' : `删除 (${selectedItems.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
