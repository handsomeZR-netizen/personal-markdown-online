'use client';

/**
 * 笔记列表客户端组件
 * 根据笔记数量自动选择渲染策略：
 * - 少量笔记（<50）：直接渲染
 * - 大量笔记（>=50）：使用虚拟滚动
 */

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { OptimizedNoteCard } from './optimized-note-card';
import { VirtualizedNoteGrid } from './virtualized-note-grid';
import { deleteNote } from '@/lib/actions/notes';
import { toast } from 'sonner';

type Note = {
  id: string;
  title: string;
  content: string;
  summary?: string | null;
  createdAt: Date;
  updatedAt: Date;
  tags?: Array<{ id: string; name: string }>;
  category?: { id: string; name: string } | null;
  isShared?: boolean;
  isOwner?: boolean;
  collaboratorRole?: string | null;
};

interface NotesListClientProps {
  notes: Note[];
  totalCount: number;
  /** 虚拟滚动阈值，超过此数量使用虚拟滚动 */
  virtualizeThreshold?: number;
}

/**
 * 智能笔记列表组件
 * 自动根据数据量选择最优渲染策略
 */
export function NotesListClient({ 
  notes, 
  totalCount,
  virtualizeThreshold = 50 
}: NotesListClientProps) {
  const router = useRouter();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // 过滤掉正在删除的笔记
  const visibleNotes = useMemo(() => 
    notes.filter(note => !deletingIds.has(note.id)),
    [notes, deletingIds]
  );

  // 事件委托：统一处理导航
  const handleNavigate = useCallback((noteId: string) => {
    router.push(`/notes/${noteId}`);
  }, [router]);

  // 事件委托：统一处理删除
  const handleDelete = useCallback(async (noteId: string) => {
    setDeletingIds(prev => new Set(prev).add(noteId));
    
    try {
      await deleteNote(noteId);
      toast.success('笔记已删除');
    } catch (error) {
      // 删除失败，恢复显示
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(noteId);
        return next;
      });
      toast.error('删除失败');
    }
  }, []);

  // 空状态
  if (visibleNotes.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-lg">暂无笔记</p>
        <p className="text-muted-foreground text-sm mt-2">
          点击右上角按钮创建第一篇笔记
        </p>
      </div>
    );
  }

  // 大量笔记：使用虚拟滚动
  if (totalCount >= virtualizeThreshold) {
    return (
      <VirtualizedNoteGrid 
        notes={visibleNotes}
        className="mt-4"
      />
    );
  }

  // 少量笔记：直接渲染（使用事件委托优化）
  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      role="list"
      aria-label="笔记列表"
    >
      {visibleNotes.map((note) => (
        <OptimizedNoteCard 
          key={note.id} 
          note={note}
          onNavigate={handleNavigate}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}

/**
 * 带分页的笔记列表
 * 适用于服务端分页场景
 */
export function PaginatedNotesList({ 
  notes,
  totalCount,
}: NotesListClientProps) {
  const router = useRouter();

  const handleNavigate = useCallback((noteId: string) => {
    router.push(`/notes/${noteId}`);
  }, [router]);

  const handleDelete = useCallback(async (noteId: string) => {
    try {
      await deleteNote(noteId);
      toast.success('笔记已删除');
      router.refresh();
    } catch (error) {
      toast.error('删除失败');
    }
  }, [router]);

  if (notes.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-lg">暂无笔记</p>
      </div>
    );
  }

  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      role="list"
      aria-label="笔记列表"
    >
      {notes.map((note) => (
        <OptimizedNoteCard 
          key={note.id} 
          note={note}
          onNavigate={handleNavigate}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
