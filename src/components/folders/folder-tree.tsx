'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { FolderItem } from './folder-item';

/**
 * FolderTree Component
 * Displays a recursive tree structure of folders and notes
 * Validates: Requirements 4.2, 4.3
 */

export interface FolderNode {
  id: string;
  name: string;
  type: 'folder' | 'note';
  parentId: string | null;
  children?: FolderNode[];
  noteCount?: number;
  updatedAt?: Date;
}

interface FolderTreeProps {
  nodes: FolderNode[];
  onNodeClick?: (node: FolderNode) => void;
  onNodeMove?: (nodeId: string, nodeType: 'folder' | 'note', newParentId: string | null) => Promise<void>;
  onNodeReorder?: (nodeId: string, nodeType: 'folder' | 'note', targetId: string, position: 'before' | 'after') => Promise<void>;
  selectedNodeId?: string;
  enableManualSort?: boolean;
  className?: string;
}

export function FolderTree({
  nodes,
  onNodeClick,
  onNodeMove,
  onNodeReorder,
  selectedNodeId,
  enableManualSort = false,
  className,
}: FolderTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = useCallback((nodeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const isExpanded = useCallback(
    (nodeId: string) => expandedIds.has(nodeId),
    [expandedIds]
  );

  const renderNode = useCallback(
    (node: FolderNode, level: number): React.ReactNode => {
      return (
        <FolderItem
          key={node.id}
          node={node}
          level={level}
          isExpanded={isExpanded(node.id)}
          isSelected={node.id === selectedNodeId}
          onToggle={() => toggleExpanded(node.id)}
          onClick={() => onNodeClick?.(node)}
          onMove={onNodeMove}
          onReorder={onNodeReorder}
          enableManualSort={enableManualSort}
          renderChildren={(children) =>
            children.map((child) => renderNode(child, level + 1))
          }
        />
      );
    },
    [isExpanded, selectedNodeId, toggleExpanded, onNodeClick, onNodeMove, onNodeReorder, enableManualSort]
  );

  return (
    <div className={cn('folder-tree space-y-0.5', className)}>
      {nodes.map((node) => renderNode(node, 0))}
    </div>
  );
}
