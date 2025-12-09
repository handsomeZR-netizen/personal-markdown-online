// Sorting types and utilities

export type SortBy = 'name' | 'createdAt' | 'updatedAt' | 'manual';
export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  sortBy: SortBy;
  sortOrder: SortOrder;
}

export interface SortableItem {
  id: string;
  name?: string;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
  sortOrder: number;
}

export const DEFAULT_SORT_OPTIONS: SortOptions = {
  sortBy: 'updatedAt',
  sortOrder: 'desc',
};

export const SORT_OPTIONS: Array<{ value: SortBy; label: string }> = [
  { value: 'name', label: '名称' },
  { value: 'createdAt', label: '创建时间' },
  { value: 'updatedAt', label: '修改时间' },
  { value: 'manual', label: '手动排序' },
];
