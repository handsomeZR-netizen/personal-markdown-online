// Sorting utility functions

import { SortBy, SortOrder, SortableItem } from './types';

/**
 * Sort items based on the specified criteria
 */
export function sortItems<T extends SortableItem>(
  items: T[],
  sortBy: SortBy,
  sortOrder: SortOrder
): T[] {
  const sorted = [...items];

  switch (sortBy) {
    case 'name':
      sorted.sort((a, b) => {
        const nameA = (a.name || a.title || '').toLowerCase();
        const nameB = (b.name || b.title || '').toLowerCase();
        return sortOrder === 'asc'
          ? nameA.localeCompare(nameB, 'zh-CN')
          : nameB.localeCompare(nameA, 'zh-CN');
      });
      break;

    case 'createdAt':
      sorted.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      });
      break;

    case 'updatedAt':
      sorted.sort((a, b) => {
        const timeA = new Date(a.updatedAt).getTime();
        const timeB = new Date(b.updatedAt).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      });
      break;

    case 'manual':
      sorted.sort((a, b) => {
        return sortOrder === 'asc'
          ? a.sortOrder - b.sortOrder
          : b.sortOrder - a.sortOrder;
      });
      break;

    default:
      // Default to updatedAt desc
      sorted.sort((a, b) => {
        const timeA = new Date(a.updatedAt).getTime();
        const timeB = new Date(b.updatedAt).getTime();
        return timeB - timeA;
      });
  }

  return sorted;
}

/**
 * Get Prisma orderBy clause based on sort options
 */
export function getPrismaOrderBy(sortBy: SortBy, sortOrder: SortOrder) {
  switch (sortBy) {
    case 'name':
      return { name: sortOrder };
    case 'createdAt':
      return { createdAt: sortOrder };
    case 'updatedAt':
      return { updatedAt: sortOrder };
    case 'manual':
      return { sortOrder: sortOrder };
    default:
      return { updatedAt: 'desc' as const };
  }
}

/**
 * Calculate new sort order for manual sorting
 * Places item between prevItem and nextItem
 */
export function calculateSortOrder(
  prevItem: SortableItem | null,
  nextItem: SortableItem | null
): number {
  if (!prevItem && !nextItem) {
    return 0;
  }

  if (!prevItem) {
    // Moving to the top
    return nextItem!.sortOrder - 1000;
  }

  if (!nextItem) {
    // Moving to the bottom
    return prevItem.sortOrder + 1000;
  }

  // Moving between two items
  return Math.floor((prevItem.sortOrder + nextItem.sortOrder) / 2);
}

/**
 * Rebalance sort orders when they get too close together
 */
export function rebalanceSortOrders<T extends SortableItem>(
  items: T[]
): Array<{ id: string; sortOrder: number }> {
  const updates: Array<{ id: string; sortOrder: number }> = [];
  
  items.forEach((item, index) => {
    const newSortOrder = index * 1000;
    if (item.sortOrder !== newSortOrder) {
      updates.push({ id: item.id, sortOrder: newSortOrder });
    }
  });

  return updates;
}
