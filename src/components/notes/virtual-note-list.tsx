'use client';

/**
 * 虚拟滚动笔记列表组件
 * 优化大量笔记时的渲染性能
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

interface VirtualNoteListProps {
  notes: Note[];
  itemHeight?: number; // 每个笔记卡片的预估高度
  overscan?: number; // 预渲染的额外项数
  className?: string;
}

interface VisibleRange {
  start: number;
  end: number;
}

/**
 * 虚拟滚动笔记列表
 * 只渲染可见区域的笔记，提升大量笔记时的性能
 */
export function VirtualNoteList({
  notes,
  itemHeight = 200,
  overscan = 3,
  className = '',
}: VirtualNoteListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState<VisibleRange>({
    start: 0,
    end: 10,
  });

  // 计算可见范围
  const calculateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;

    // 计算可见区域的起始和结束索引
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(
      notes.length,
      start + visibleCount + overscan * 2
    );

    setVisibleRange({ start, end });
  }, [notes.length, itemHeight, overscan]);

  // 监听滚动事件
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 初始计算
    calculateVisibleRange();

    // 使用 requestAnimationFrame 优化滚动性能
    let rafId: number;
    const handleScroll = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(calculateVisibleRange);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [calculateVisibleRange]);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      calculateVisibleRange();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateVisibleRange]);

  // 获取可见的笔记
  const visibleNotes = notes.slice(visibleRange.start, visibleRange.end);

  // 计算总高度和偏移量
  const totalHeight = notes.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ height: '100%' }}
      role="list"
      aria-label="虚拟滚动笔记列表"
    >
      {/* 占位容器，用于保持滚动条正确 */}
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        {/* 可见项容器 */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visibleNotes.map((note, index) => (
              <div
                key={note.id}
                data-index={visibleRange.start + index}
                style={{ minHeight: `${itemHeight}px` }}
              >
                <NoteCard note={note} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 空状态 */}
      {notes.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">暂无笔记</p>
        </div>
      )}
    </div>
  );
}
