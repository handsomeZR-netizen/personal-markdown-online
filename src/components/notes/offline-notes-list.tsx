'use client';

/**
 * 离线笔记列表组件
 * 使用虚拟滚动优化大量笔记的渲染性能
 */

import { useEffect, useState } from 'react';
import { VirtualNoteGrid } from './virtual-note-grid';
import { indexedDBManager } from '@/lib/offline/indexeddb-manager';
import { useNetworkStatus } from '@/contexts/network-status-context';
import type { LocalNote } from '@/types/offline';

type Note = {
  id: string;
  title: string;
  content: string;
  summary?: string | null;
  createdAt: Date;
  updatedAt: Date;
  tags: Array<{ id: string; name: string }>;
  category: { id: string; name: string } | null;
};

interface OfflineNotesListProps {
  userId: string;
  className?: string;
}

/**
 * 离线笔记列表
 * 从 IndexedDB 加载笔记并使用虚拟滚动渲染
 */
export function OfflineNotesList({
  userId,
  className = '',
}: OfflineNotesListProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useNetworkStatus();

  // 加载离线笔记
  useEffect(() => {
    let mounted = true;

    const loadNotes = async () => {
      try {
        setLoading(true);
        setError(null);

        // 从 IndexedDB 加载笔记
        const localNotes = await indexedDBManager.getAllNotes(userId);

        if (!mounted) return;

        // 转换为 Note 类型
        const convertedNotes: Note[] = localNotes.map((localNote: LocalNote) => ({
          id: localNote.id,
          title: localNote.title,
          content: localNote.content,
          summary: localNote.summary,
          tags: localNote.tags.map((tag) => ({ id: tag, name: tag })),
          category: localNote.categoryId ? { id: localNote.categoryId, name: '' } : null,
          createdAt: new Date(localNote.createdAt),
          updatedAt: new Date(localNote.updatedAt),
        }));

        setNotes(convertedNotes);
      } catch (err) {
        console.error('Failed to load offline notes:', err);
        if (mounted) {
          setError('加载离线笔记失败');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadNotes();

    return () => {
      mounted = false;
    };
  }, [userId]);

  // 显示加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
          <span>加载笔记中...</span>
        </div>
      </div>
    );
  }

  // 显示错误状态
  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-2">
          <p className="text-destructive">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  // 显示离线提示
  const showOfflineIndicator = !isOnline && notes.length > 0;

  return (
    <div className={className}>
      {showOfflineIndicator && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            📱 离线模式：显示本地缓存的 {notes.length} 条笔记
          </p>
        </div>
      )}

      <VirtualNoteGrid notes={notes} />
    </div>
  );
}
