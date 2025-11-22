'use client';

/**
 * 虚拟滚动笔记网格组件
 * 支持动态高度和响应式布局
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { NoteCard } from './note-card';

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

interface VirtualNoteGridProps {
  notes: Note[];
  className?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

interface ItemPosition {
  top: number;
  height: number;
}

/**
 * 虚拟滚动笔记网格
 * 使用 Intersection Observer 实现无限滚动
 */
export function VirtualNoteGrid({
  notes,
  className = '',
  onLoadMore,
  hasMore = false,
  loading = false,
}: VirtualNoteGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [visibleNotes, setVisibleNotes] = useState<Note[]>([]);
  const [itemsPerRow, setItemsPerRow] = useState(1);
  const itemHeightsRef = useRef<Map<string, number>>(new Map());

  // 计算每行显示的项数
  const calculateItemsPerRow = useCallback(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    
    // 根据容器宽度计算列数（与 Tailwind 的 grid 类对应）
    if (width >= 1280) {
      // xl: 3 columns
      setItemsPerRow(3);
    } else if (width >= 768) {
      // md: 2 columns
      setItemsPerRow(2);
    } else {
      // default: 1 column
      setItemsPerRow(1);
    }
  }, []);

  // 初始化和窗口大小变化时重新计算
  useEffect(() => {
    calculateItemsPerRow();

    const handleResize = () => {
      calculateItemsPerRow();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateItemsPerRow]);

  // 使用 Intersection Observer 实现无限滚动
  useEffect(() => {
    if (!sentinelRef.current || !onLoadMore || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          onLoadMore();
        }
      },
      {
        root: null,
        rootMargin: '200px', // 提前 200px 触发加载
        threshold: 0.1,
      }
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [onLoadMore, hasMore, loading]);

  // 渐进式加载笔记
  useEffect(() => {
    // 初始加载前 30 个笔记
    const initialBatch = Math.min(30, notes.length);
    setVisibleNotes(notes.slice(0, initialBatch));

    // 如果有更多笔记，逐步加载
    if (notes.length > initialBatch) {
      const timer = setTimeout(() => {
        setVisibleNotes(notes);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [notes]);

  return (
    <div
      ref={containerRef}
      className={`w-full ${className}`}
      role="list"
      aria-label="笔记网格"
    >
      {/* 笔记网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleNotes.map((note) => (
          <div key={note.id} className="min-h-[180px]">
            <NoteCard note={note} />
          </div>
        ))}
      </div>

      {/* 加载更多的哨兵元素 */}
      {hasMore && (
        <div
          ref={sentinelRef}
          className="h-20 flex items-center justify-center mt-4"
        >
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
              <span>加载中...</span>
            </div>
          )}
        </div>
      )}

      {/* 空状态 */}
      {notes.length === 0 && !loading && (
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">暂无笔记</p>
        </div>
      )}
    </div>
  );
}
