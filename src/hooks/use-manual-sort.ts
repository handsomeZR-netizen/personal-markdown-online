import { useState, useCallback } from 'react';
import { calculateSortOrder, rebalanceSortOrders, SortableItem } from '@/lib/sorting';
import { toast } from 'sonner';

interface UseManualSortOptions {
  onReorder: (updates: Array<{ id: string; sortOrder: number }>) => Promise<void>;
  items: SortableItem[];
}

/**
 * Hook for managing manual sorting with drag and drop
 * Validates: Requirement 22.4
 */
export function useManualSort({ onReorder, items }: UseManualSortOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  /**
   * Handle drag start
   */
  const handleDragStart = useCallback((itemId: string) => {
    setIsDragging(true);
    setDraggedItemId(itemId);
  }, []);

  /**
   * Handle drag end
   */
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedItemId(null);
  }, []);

  /**
   * Handle drop - reorder items
   */
  const handleDrop = useCallback(
    async (targetItemId: string, position: 'before' | 'after') => {
      if (!draggedItemId || draggedItemId === targetItemId) {
        handleDragEnd();
        return;
      }

      try {
        const draggedItem = items.find((item) => item.id === draggedItemId);
        const targetItem = items.find((item) => item.id === targetItemId);

        if (!draggedItem || !targetItem) {
          throw new Error('Item not found');
        }

        // Find the items before and after the target position
        const targetIndex = items.indexOf(targetItem);
        let prevItem: SortableItem | null = null;
        let nextItem: SortableItem | null = null;

        if (position === 'before') {
          prevItem = targetIndex > 0 ? items[targetIndex - 1] : null;
          nextItem = targetItem;
        } else {
          prevItem = targetItem;
          nextItem = targetIndex < items.length - 1 ? items[targetIndex + 1] : null;
        }

        // Calculate new sort order
        const newSortOrder = calculateSortOrder(prevItem, nextItem);

        // Update the dragged item's sort order
        await onReorder([{ id: draggedItemId, sortOrder: newSortOrder }]);

        // Check if we need to rebalance
        const updatedItems = items.map((item) =>
          item.id === draggedItemId ? { ...item, sortOrder: newSortOrder } : item
        );
        
        // Sort by sortOrder to check spacing
        updatedItems.sort((a, b) => a.sortOrder - b.sortOrder);
        
        // Check if any two adjacent items are too close (< 10 apart)
        let needsRebalance = false;
        for (let i = 0; i < updatedItems.length - 1; i++) {
          if (Math.abs(updatedItems[i + 1].sortOrder - updatedItems[i].sortOrder) < 10) {
            needsRebalance = true;
            break;
          }
        }

        if (needsRebalance) {
          const rebalanceUpdates = rebalanceSortOrders(updatedItems);
          if (rebalanceUpdates.length > 0) {
            await onReorder(rebalanceUpdates);
          }
        }

        toast.success('排序已更新');
      } catch (error) {
        console.error('Failed to reorder:', error);
        toast.error('排序更新失败');
      } finally {
        handleDragEnd();
      }
    },
    [draggedItemId, items, onReorder, handleDragEnd]
  );

  return {
    isDragging,
    draggedItemId,
    handleDragStart,
    handleDragEnd,
    handleDrop,
  };
}
