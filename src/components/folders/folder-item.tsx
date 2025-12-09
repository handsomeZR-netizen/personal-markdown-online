'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FolderNode } from './folder-tree';

/**
 * FolderItem Component
 * Renders a single folder or note item in the tree
 * Supports drag and drop for moving items
 * Validates: Requirements 4.2, 4.3, 4.4, 4.5
 */

interface FolderItemProps {
  node: FolderNode;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onClick: () => void;
  onMove?: (nodeId: string, nodeType: 'folder' | 'note', newParentId: string | null) => Promise<void>;
  onReorder?: (nodeId: string, nodeType: 'folder' | 'note', targetId: string, position: 'before' | 'after') => Promise<void>;
  renderChildren?: (children: FolderNode[]) => React.ReactNode;
  enableManualSort?: boolean;
}

export function FolderItem({
  node,
  level,
  isExpanded,
  isSelected,
  onToggle,
  onClick,
  onMove,
  onReorder,
  renderChildren,
  enableManualSort = false,
}: FolderItemProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | 'inside' | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);

  const hasChildren = node.children && node.children.length > 0;
  const isFolder = node.type === 'folder';

  // Detect mobile screen size (Requirement 12.1)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: node.id,
      type: node.type,
    }));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (enableManualSort && onReorder) {
      // Calculate drop position based on mouse position
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const height = rect.height;
      
      if (y < height * 0.33) {
        setDropPosition('before');
      } else if (y > height * 0.67 && isFolder) {
        setDropPosition('inside');
      } else if (y > height * 0.67) {
        setDropPosition('after');
      } else {
        setDropPosition(isFolder ? 'inside' : 'after');
      }
    } else if (isFolder) {
      setDropPosition('inside');
    }
    
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
    setDropPosition(null);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const draggedId = data.id;
      const draggedType = data.type;

      // Don't allow dropping on itself
      if (draggedId === node.id) {
        setDropPosition(null);
        return;
      }

      // Handle reordering (manual sort)
      if (enableManualSort && onReorder && (dropPosition === 'before' || dropPosition === 'after')) {
        await onReorder(draggedId, draggedType, node.id, dropPosition);
        setDropPosition(null);
        return;
      }

      // Handle moving to folder
      if (isFolder && onMove && dropPosition === 'inside') {
        // Don't allow dropping a folder into its own descendant
        if (draggedType === 'folder' && isDescendant(node, draggedId)) {
          setDropPosition(null);
          return;
        }

        await onMove(draggedId, draggedType, node.id);
      }
    } catch (error) {
      console.error('Drop error:', error);
    } finally {
      setDropPosition(null);
    }
  };

  // Check if targetNode is a descendant of nodeId
  const isDescendant = (targetNode: FolderNode, nodeId: string): boolean => {
    if (!targetNode.children) return false;
    
    for (const child of targetNode.children) {
      if (child.id === nodeId) return true;
      if (isDescendant(child, nodeId)) return true;
    }
    
    return false;
  };

  const handleItemClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolder && hasChildren) {
      onToggle();
    }
    onClick();
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };

  // Touch handlers for mobile swipe gestures (Requirement 12.1)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    const touchEndX = e.touches[0].clientX;
    const touchEndY = e.touches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Only handle horizontal swipes (ignore vertical scrolling)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Detect swipe (horizontal movement > 50px and mostly horizontal)
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 2) {
      // Swipe detected - could trigger actions in the future
      // For now, just provide visual feedback
      console.log('Swipe detected on folder item:', node.name, deltaX > 0 ? 'right' : 'left');
    }
  };

  return (
    <div className="folder-item">
      <div className="relative">
        {/* Drop indicator for before */}
        {isDragOver && dropPosition === 'before' && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary z-10" />
        )}
        
        {/* Drop indicator for after */}
        {isDragOver && dropPosition === 'after' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary z-10" />
        )}
        
        <div
          className={cn(
            'group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
            'hover:bg-accent',
            isSelected && 'bg-accent',
            isDragOver && dropPosition === 'inside' && 'bg-primary/10 ring-2 ring-primary',
            isDragging && 'opacity-50',
            isMobile && 'active:scale-98 active:bg-accent' // Mobile touch feedback
          )}
          style={{ 
            paddingLeft: isMobile ? `${level * 12 + 8}px` : `${level * 16 + 8}px`,
            '--level': level 
          } as React.CSSProperties}
          draggable={!isMobile} // Disable drag on mobile
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleItemClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
        {/* Drag handle - only show in manual sort mode on desktop */}
        {enableManualSort && !isMobile && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
        )}

        {/* Chevron for folders with children */}
        {isFolder && hasChildren && (
          <button
            onClick={handleChevronClick}
            className="p-0.5 hover:bg-accent-foreground/10 rounded"
            aria-label={isExpanded ? '折叠' : '展开'}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}

        {/* Spacer for items without chevron */}
        {(!isFolder || !hasChildren) && <div className="w-5" />}

        {/* Icon - larger on mobile for better visibility */}
        {isFolder ? (
          isExpanded ? (
            <FolderOpen className={cn("text-primary", isMobile ? "h-5 w-5" : "h-4 w-4")} />
          ) : (
            <Folder className={cn("text-primary", isMobile ? "h-5 w-5" : "h-4 w-4")} />
          )
        ) : (
          <FileText className={cn("text-muted-foreground", isMobile ? "h-5 w-5" : "h-4 w-4")} />
        )}

        {/* Name */}
        <span className="flex-1 truncate text-sm">{node.name}</span>

        {/* Note count for folders */}
        {isFolder && node.noteCount !== undefined && node.noteCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {node.noteCount}
          </span>
        )}
        </div>
      </div>

      {/* Children */}
      {isFolder && hasChildren && isExpanded && renderChildren && (
        <div className="folder-children">
          {renderChildren(node.children!)}
        </div>
      )}
    </div>
  );
}
