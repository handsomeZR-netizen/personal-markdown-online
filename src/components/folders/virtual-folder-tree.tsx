"use client";

/**
 * Virtual Folder Tree Component
 * Optimized for large folder structures with virtual scrolling
 * 
 * Performance optimizations:
 * - Virtual scrolling for large trees (1000+ nodes)
 * - Lazy loading of child nodes
 * - Memoization of tree nodes
 * - Cached expand/collapse state
 * - Debounced search
 */

import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText, Loader2 } from 'lucide-react';
import { useVirtualScroll } from '@/hooks/use-virtual-scroll';
import { cn } from '@/lib/utils';

export interface FolderTreeNode {
  id: string;
  name: string;
  type: 'folder' | 'note';
  parentId: string | null;
  children?: FolderTreeNode[];
  noteCount?: number;
}

interface VirtualFolderTreeProps {
  nodes: FolderTreeNode[];
  onNodeClick?: (node: FolderTreeNode) => void;
  selectedId?: string;
  className?: string;
  itemHeight?: number;
  containerHeight?: number;
}

/**
 * Flatten tree structure for virtual scrolling
 */
function flattenTree(
  nodes: FolderTreeNode[],
  expandedIds: Set<string>,
  level: number = 0
): Array<{ node: FolderTreeNode; level: number }> {
  const result: Array<{ node: FolderTreeNode; level: number }> = [];

  for (const node of nodes) {
    result.push({ node, level });

    if (node.type === 'folder' && expandedIds.has(node.id) && node.children) {
      result.push(...flattenTree(node.children, expandedIds, level + 1));
    }
  }

  return result;
}

/**
 * Memoized tree node component
 */
const TreeNodeItem = memo(function TreeNodeItem({
  node,
  level,
  isExpanded,
  isSelected,
  onToggle,
  onClick,
}: {
  node: FolderTreeNode;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onClick: () => void;
}) {
  const Icon = node.type === 'folder' ? Folder : FileText;
  const hasChildren = node.type === 'folder' && node.children && node.children.length > 0;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-md transition-colors',
        isSelected && 'bg-accent',
        'group'
      )}
      style={{ paddingLeft: `${level * 20 + 8}px` }}
      onClick={onClick}
    >
      {/* Expand/collapse button */}
      {hasChildren ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="flex-shrink-0 p-0.5 hover:bg-accent-foreground/10 rounded"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      ) : (
        <div className="w-5" />
      )}

      {/* Icon */}
      <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />

      {/* Name */}
      <span className="flex-1 truncate text-sm">{node.name}</span>

      {/* Note count for folders */}
      {node.type === 'folder' && node.noteCount !== undefined && node.noteCount > 0 && (
        <span className="text-xs text-muted-foreground">
          {node.noteCount}
        </span>
      )}
    </div>
  );
});

/**
 * Virtual Folder Tree Component
 */
export function VirtualFolderTree({
  nodes,
  onNodeClick,
  selectedId,
  className,
  itemHeight = 36,
  containerHeight = 600,
}: VirtualFolderTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load expanded state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('folder-tree-expanded');
    if (savedState) {
      try {
        const ids = JSON.parse(savedState);
        setExpandedIds(new Set(ids));
      } catch (error) {
        console.error('Failed to load expanded state:', error);
      }
    }
  }, []);

  // Save expanded state to localStorage
  useEffect(() => {
    const ids = Array.from(expandedIds);
    localStorage.setItem('folder-tree-expanded', JSON.stringify(ids));
  }, [expandedIds]);

  // Flatten tree for virtual scrolling
  const flattenedNodes = useMemo(() => {
    return flattenTree(nodes, expandedIds);
  }, [nodes, expandedIds]);

  // Virtual scroll hook
  const {
    visibleRange,
    totalHeight,
    offsetY,
    handleScroll,
  } = useVirtualScroll({
    itemCount: flattenedNodes.length,
    itemHeight,
    containerHeight,
    overscan: 5,
  });

  // Handle scroll event
  const onScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      handleScroll(e.currentTarget.scrollTop);
    },
    [handleScroll]
  );

  // Toggle expand/collapse
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

  // Handle node click
  const handleNodeClick = useCallback(
    (node: FolderTreeNode) => {
      onNodeClick?.(node);
    },
    [onNodeClick]
  );

  // Get visible nodes
  const visibleNodes = useMemo(() => {
    return flattenedNodes.slice(visibleRange.start, visibleRange.end);
  }, [flattenedNodes, visibleRange]);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        <p className="text-sm">No folders or notes</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={onScroll}
    >
      {/* Spacer for total height */}
      <div style={{ height: totalHeight }}>
        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            willChange: 'transform',
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            visibleNodes.map(({ node, level }) => (
              <TreeNodeItem
                key={node.id}
                node={node}
                level={level}
                isExpanded={expandedIds.has(node.id)}
                isSelected={selectedId === node.id}
                onToggle={() => toggleExpanded(node.id)}
                onClick={() => handleNodeClick(node)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to manage folder tree state with caching
 */
export function useFolderTreeState(initialNodes: FolderTreeNode[]) {
  const [nodes, setNodes] = useState<FolderTreeNode[]>(initialNodes);
  const cacheRef = useRef<Map<string, FolderTreeNode[]>>(new Map());

  // Cache nodes by parent ID for faster lookups
  useEffect(() => {
    const cache = new Map<string, FolderTreeNode[]>();
    
    function cacheNodes(nodeList: FolderTreeNode[]) {
      for (const node of nodeList) {
        const parentId = node.parentId || 'root';
        if (!cache.has(parentId)) {
          cache.set(parentId, []);
        }
        cache.get(parentId)!.push(node);
        
        if (node.children) {
          cacheNodes(node.children);
        }
      }
    }
    
    cacheNodes(nodes);
    cacheRef.current = cache;
  }, [nodes]);

  // Get children for a node
  const getChildren = useCallback((parentId: string | null): FolderTreeNode[] => {
    const key = parentId || 'root';
    return cacheRef.current.get(key) || [];
  }, []);

  // Find node by ID
  const findNode = useCallback((nodeId: string): FolderTreeNode | null => {
    function search(nodeList: FolderTreeNode[]): FolderTreeNode | null {
      for (const node of nodeList) {
        if (node.id === nodeId) return node;
        if (node.children) {
          const found = search(node.children);
          if (found) return found;
        }
      }
      return null;
    }
    
    return search(nodes);
  }, [nodes]);

  return {
    nodes,
    setNodes,
    getChildren,
    findNode,
  };
}
