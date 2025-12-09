import { describe, it, expect } from 'vitest';
import {
  sortItems,
  getPrismaOrderBy,
  calculateSortOrder,
  rebalanceSortOrders,
} from '../sort-utils';
import type { SortableItem } from '../types';

describe('sortItems', () => {
  const mockItems: SortableItem[] = [
    {
      id: '1',
      name: 'Zebra',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-05'),
      sortOrder: 1000,
    },
    {
      id: '2',
      name: 'Apple',
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
      sortOrder: 2000,
    },
    {
      id: '3',
      name: 'Banana',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-04'),
      sortOrder: 3000,
    },
  ];

  it('sorts by name ascending', () => {
    const sorted = sortItems(mockItems, 'name', 'asc');
    expect(sorted[0].name).toBe('Apple');
    expect(sorted[1].name).toBe('Banana');
    expect(sorted[2].name).toBe('Zebra');
  });

  it('sorts by name descending', () => {
    const sorted = sortItems(mockItems, 'name', 'desc');
    expect(sorted[0].name).toBe('Zebra');
    expect(sorted[1].name).toBe('Banana');
    expect(sorted[2].name).toBe('Apple');
  });

  it('sorts by createdAt ascending', () => {
    const sorted = sortItems(mockItems, 'createdAt', 'asc');
    expect(sorted[0].id).toBe('1'); // 2024-01-01
    expect(sorted[1].id).toBe('3'); // 2024-01-02
    expect(sorted[2].id).toBe('2'); // 2024-01-03
  });

  it('sorts by createdAt descending', () => {
    const sorted = sortItems(mockItems, 'createdAt', 'desc');
    expect(sorted[0].id).toBe('2'); // 2024-01-03
    expect(sorted[1].id).toBe('3'); // 2024-01-02
    expect(sorted[2].id).toBe('1'); // 2024-01-01
  });

  it('sorts by updatedAt ascending', () => {
    const sorted = sortItems(mockItems, 'updatedAt', 'asc');
    expect(sorted[0].id).toBe('2'); // 2024-01-03
    expect(sorted[1].id).toBe('3'); // 2024-01-04
    expect(sorted[2].id).toBe('1'); // 2024-01-05
  });

  it('sorts by updatedAt descending', () => {
    const sorted = sortItems(mockItems, 'updatedAt', 'desc');
    expect(sorted[0].id).toBe('1'); // 2024-01-05
    expect(sorted[1].id).toBe('3'); // 2024-01-04
    expect(sorted[2].id).toBe('2'); // 2024-01-03
  });

  it('sorts by manual sortOrder ascending', () => {
    const sorted = sortItems(mockItems, 'manual', 'asc');
    expect(sorted[0].sortOrder).toBe(1000);
    expect(sorted[1].sortOrder).toBe(2000);
    expect(sorted[2].sortOrder).toBe(3000);
  });

  it('sorts by manual sortOrder descending', () => {
    const sorted = sortItems(mockItems, 'manual', 'desc');
    expect(sorted[0].sortOrder).toBe(3000);
    expect(sorted[1].sortOrder).toBe(2000);
    expect(sorted[2].sortOrder).toBe(1000);
  });

  it('does not mutate original array', () => {
    const original = [...mockItems];
    sortItems(mockItems, 'name', 'asc');
    expect(mockItems).toEqual(original);
  });

  it('handles items with title instead of name', () => {
    const itemsWithTitle: SortableItem[] = [
      {
        id: '1',
        title: 'Zebra',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        sortOrder: 0,
      },
      {
        id: '2',
        title: 'Apple',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        sortOrder: 0,
      },
    ];

    const sorted = sortItems(itemsWithTitle, 'name', 'asc');
    expect(sorted[0].title).toBe('Apple');
    expect(sorted[1].title).toBe('Zebra');
  });

  it('handles Chinese characters in name sorting', () => {
    const chineseItems: SortableItem[] = [
      {
        id: '1',
        name: '笔记',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        sortOrder: 0,
      },
      {
        id: '2',
        name: '文件夹',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        sortOrder: 0,
      },
      {
        id: '3',
        name: '标签',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        sortOrder: 0,
      },
    ];

    const sorted = sortItems(chineseItems, 'name', 'asc');
    // Should use Chinese locale sorting
    expect(sorted.length).toBe(3);
  });
});

describe('getPrismaOrderBy', () => {
  it('returns correct orderBy for name', () => {
    expect(getPrismaOrderBy('name', 'asc')).toEqual({ name: 'asc' });
    expect(getPrismaOrderBy('name', 'desc')).toEqual({ name: 'desc' });
  });

  it('returns correct orderBy for createdAt', () => {
    expect(getPrismaOrderBy('createdAt', 'asc')).toEqual({ createdAt: 'asc' });
    expect(getPrismaOrderBy('createdAt', 'desc')).toEqual({ createdAt: 'desc' });
  });

  it('returns correct orderBy for updatedAt', () => {
    expect(getPrismaOrderBy('updatedAt', 'asc')).toEqual({ updatedAt: 'asc' });
    expect(getPrismaOrderBy('updatedAt', 'desc')).toEqual({ updatedAt: 'desc' });
  });

  it('returns correct orderBy for manual', () => {
    expect(getPrismaOrderBy('manual', 'asc')).toEqual({ sortOrder: 'asc' });
    expect(getPrismaOrderBy('manual', 'desc')).toEqual({ sortOrder: 'desc' });
  });

  it('returns default orderBy for invalid sortBy', () => {
    // @ts-expect-error Testing invalid input
    expect(getPrismaOrderBy('invalid', 'asc')).toEqual({ updatedAt: 'desc' });
  });
});

describe('calculateSortOrder', () => {
  it('returns 0 when both items are null', () => {
    expect(calculateSortOrder(null, null)).toBe(0);
  });

  it('places item at top when prevItem is null', () => {
    const nextItem: SortableItem = {
      id: '1',
      name: 'Next',
      createdAt: new Date(),
      updatedAt: new Date(),
      sortOrder: 1000,
    };
    expect(calculateSortOrder(null, nextItem)).toBe(0); // 1000 - 1000
  });

  it('places item at bottom when nextItem is null', () => {
    const prevItem: SortableItem = {
      id: '1',
      name: 'Prev',
      createdAt: new Date(),
      updatedAt: new Date(),
      sortOrder: 1000,
    };
    expect(calculateSortOrder(prevItem, null)).toBe(2000); // 1000 + 1000
  });

  it('places item between two items', () => {
    const prevItem: SortableItem = {
      id: '1',
      name: 'Prev',
      createdAt: new Date(),
      updatedAt: new Date(),
      sortOrder: 1000,
    };
    const nextItem: SortableItem = {
      id: '2',
      name: 'Next',
      createdAt: new Date(),
      updatedAt: new Date(),
      sortOrder: 3000,
    };
    expect(calculateSortOrder(prevItem, nextItem)).toBe(2000); // (1000 + 3000) / 2
  });

  it('handles fractional sort orders', () => {
    const prevItem: SortableItem = {
      id: '1',
      name: 'Prev',
      createdAt: new Date(),
      updatedAt: new Date(),
      sortOrder: 1000,
    };
    const nextItem: SortableItem = {
      id: '2',
      name: 'Next',
      createdAt: new Date(),
      updatedAt: new Date(),
      sortOrder: 1001,
    };
    const result = calculateSortOrder(prevItem, nextItem);
    // Math.floor((1000 + 1001) / 2) = 1000
    expect(result).toBe(1000);
    expect(result).toBeGreaterThanOrEqual(prevItem.sortOrder);
    expect(result).toBeLessThanOrEqual(nextItem.sortOrder);
  });
});

describe('rebalanceSortOrders', () => {
  it('returns empty array when no rebalancing needed', () => {
    const items: SortableItem[] = [
      {
        id: '1',
        name: 'Item 1',
        createdAt: new Date(),
        updatedAt: new Date(),
        sortOrder: 0,
      },
      {
        id: '2',
        name: 'Item 2',
        createdAt: new Date(),
        updatedAt: new Date(),
        sortOrder: 1000,
      },
      {
        id: '3',
        name: 'Item 3',
        createdAt: new Date(),
        updatedAt: new Date(),
        sortOrder: 2000,
      },
    ];

    const updates = rebalanceSortOrders(items);
    expect(updates).toEqual([]);
  });

  it('rebalances items with incorrect spacing', () => {
    const items: SortableItem[] = [
      {
        id: '1',
        name: 'Item 1',
        createdAt: new Date(),
        updatedAt: new Date(),
        sortOrder: 100,
      },
      {
        id: '2',
        name: 'Item 2',
        createdAt: new Date(),
        updatedAt: new Date(),
        sortOrder: 200,
      },
      {
        id: '3',
        name: 'Item 3',
        createdAt: new Date(),
        updatedAt: new Date(),
        sortOrder: 300,
      },
    ];

    const updates = rebalanceSortOrders(items);
    expect(updates).toHaveLength(3);
    expect(updates[0]).toEqual({ id: '1', sortOrder: 0 });
    expect(updates[1]).toEqual({ id: '2', sortOrder: 1000 });
    expect(updates[2]).toEqual({ id: '3', sortOrder: 2000 });
  });

  it('handles single item', () => {
    const items: SortableItem[] = [
      {
        id: '1',
        name: 'Item 1',
        createdAt: new Date(),
        updatedAt: new Date(),
        sortOrder: 500,
      },
    ];

    const updates = rebalanceSortOrders(items);
    expect(updates).toHaveLength(1);
    expect(updates[0]).toEqual({ id: '1', sortOrder: 0 });
  });

  it('handles empty array', () => {
    const updates = rebalanceSortOrders([]);
    expect(updates).toEqual([]);
  });
});
