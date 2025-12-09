'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * DragDropContext
 * Manages drag and drop state across folder tree components
 * Validates: Requirements 4.4, 4.5
 */

interface DragItem {
  id: string;
  type: 'folder' | 'note';
  name: string;
}

interface DragDropContextValue {
  dragItem: DragItem | null;
  isDragging: boolean;
  startDrag: (item: DragItem) => void;
  endDrag: () => void;
  canDrop: (targetId: string) => boolean;
}

const DragDropContext = createContext<DragDropContextValue | undefined>(undefined);

export function useDragDrop() {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within DragDropProvider');
  }
  return context;
}

interface DragDropProviderProps {
  children: ReactNode;
  onMove?: (itemId: string, targetId: string | null) => Promise<void>;
}

export function DragDropProvider({ children, onMove }: DragDropProviderProps) {
  const [dragItem, setDragItem] = useState<DragItem | null>(null);

  const startDrag = useCallback((item: DragItem) => {
    setDragItem(item);
  }, []);

  const endDrag = useCallback(() => {
    setDragItem(null);
  }, []);

  const canDrop = useCallback(
    (targetId: string) => {
      if (!dragItem) return false;
      
      // Can't drop on itself
      if (dragItem.id === targetId) return false;
      
      // Notes can be dropped on folders
      if (dragItem.type === 'note') return true;
      
      // Folders can be dropped on other folders
      // (circular reference check happens on the server)
      return true;
    },
    [dragItem]
  );

  const value: DragDropContextValue = {
    dragItem,
    isDragging: dragItem !== null,
    startDrag,
    endDrag,
    canDrop,
  };

  return (
    <DragDropContext.Provider value={value}>
      {children}
    </DragDropContext.Provider>
  );
}
