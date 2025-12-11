'use client';

/**
 * 高性能虚拟滚动笔记网格
 * 使用 react-window 实现真正的虚拟化
 * 
 * 性能优化：
 * 1. 只渲染可见区域的笔记卡片
 * 2. 使用事件委托减少事件监听器
 * 3. 使用 CSS containment 优化渲染
 */

import { useCallback, useRef, memo, CSSProperties } from 'react';
import { Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { OptimizedNoteCard } from './optimized-note-card';
import { useRouter } from 'next/navigation';
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

interface VirtualizedNoteGridProps {
  notes: Note[];
  className?: string;
}

// 卡片尺寸配置
const CARD_HEIGHT = 280;
const CARD_MIN_WIDTH = 320;
const GAP = 16;

// 单元格 Props 类型
interface CellData {
  notes: Note[];
  columnCount: number;
  onNavigate: (id: string) => void;
  onDelete: (id: string) => void;
}

// 单元格渲染组件
function CellRenderer({ 
  columnIndex, 
  rowIndex, 
  style,
  data
}: {
  columnIndex: number;
  rowIndex: number;
  style: CSSProperties;
  data: CellData;
}) {
  const { notes, columnCount, onNavigate, onDelete } = data;
  const index = rowIndex * columnCount + columnIndex;
  
  if (index >= notes.length) {
    return null;
  }
  
  const note = notes[index];
  
  return (
    <div
      style={{
        ...style,
        left: Number(style.left) + GAP / 2,
        top: Number(style.top) + GAP / 2,
        width: Number(style.width) - GAP,
        height: Number(style.height) - GAP,
        contain: 'layout style paint',
      }}
    >
      <OptimizedNoteCard 
        note={note} 
        onNavigate={onNavigate}
        onDelete={onDelete}
      />
    </div>
  );
}

const MemoizedCell = memo(CellRenderer);

/**
 * 虚拟化笔记网格
 * 支持响应式列数和虚拟滚动
 */
export function VirtualizedNoteGrid({ notes, className = '' }: VirtualizedNoteGridProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 事件委托：统一处理导航
  const handleNavigate = useCallback((noteId: string) => {
    router.push(`/notes/${noteId}`);
  }, [router]);
  
  // 事件委托：统一处理删除
  const handleDelete = useCallback(async (noteId: string) => {
    try {
      await deleteNote(noteId);
      toast.success('笔记已删除');
    } catch (error) {
      toast.error('删除失败');
    }
  }, []);

  if (notes.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">暂无笔记</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`w-full h-[calc(100vh-300px)] min-h-[400px] ${className}`}
      role="list"
      aria-label="笔记列表"
    >
      <AutoSizer>
        {({ height, width }) => {
          // 计算列数（响应式）
          const columnCount = Math.max(1, Math.floor(width / CARD_MIN_WIDTH));
          const columnWidth = width / columnCount;
          const rowCount = Math.ceil(notes.length / columnCount);
          
          const cellData: CellData = {
            notes,
            columnCount,
            onNavigate: handleNavigate,
            onDelete: handleDelete,
          };
          
          return (
            <Grid
              columnCount={columnCount}
              columnWidth={columnWidth}
              rowCount={rowCount}
              rowHeight={CARD_HEIGHT}
              cellComponent={MemoizedCell}
              cellProps={cellData}
              style={{ 
                width, 
                height,
                overflowX: 'hidden' 
              }}
              overscanCount={2}
            />
          );
        }}
      </AutoSizer>
    </div>
  );
}

/**
 * 简化版虚拟列表（单列）
 * 适用于移动端或窄屏
 */
export function VirtualizedNoteList({ notes, className = '' }: VirtualizedNoteGridProps) {
  const router = useRouter();
  
  const handleNavigate = useCallback((noteId: string) => {
    router.push(`/notes/${noteId}`);
  }, [router]);
  
  const handleDelete = useCallback(async (noteId: string) => {
    try {
      await deleteNote(noteId);
      toast.success('笔记已删除');
    } catch (error) {
      toast.error('删除失败');
    }
  }, []);

  if (notes.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">暂无笔记</p>
      </div>
    );
  }

  return (
    <div 
      className={`w-full h-[calc(100vh-300px)] min-h-[400px] ${className}`}
      role="list"
      aria-label="笔记列表"
    >
      <AutoSizer>
        {({ height, width }) => {
          const cellData: CellData = {
            notes,
            columnCount: 1,
            onNavigate: handleNavigate,
            onDelete: handleDelete,
          };
          
          return (
            <Grid
              columnCount={1}
              columnWidth={width}
              rowCount={notes.length}
              rowHeight={CARD_HEIGHT}
              cellComponent={MemoizedCell}
              cellProps={cellData}
              style={{ width, height }}
              overscanCount={3}
            />
          );
        }}
      </AutoSizer>
    </div>
  );
}
