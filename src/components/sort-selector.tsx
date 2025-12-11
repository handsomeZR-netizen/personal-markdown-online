'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { SortBy, SortOrder, SORT_OPTIONS } from '@/lib/sorting';
import { updateUserPreferences } from '@/lib/actions/preferences';

interface SortSelectorProps {
  onSortChange?: (sortBy: SortBy, sortOrder: SortOrder) => void;
  baseUrl?: string; // For URL-based sorting (backward compatibility)
  className?: string;
  initialSortBy?: SortBy;
  initialSortOrder?: SortOrder;
}

/**
 * SortSelector component for selecting sorting options
 * Validates: Requirements 22.1, 22.5
 */
export function SortSelector({ 
  onSortChange, 
  baseUrl, 
  className,
  initialSortBy = 'updatedAt',
  initialSortOrder = 'desc'
}: SortSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sortBy, setSortBy] = useState<SortBy>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);

  const updateURL = (newSortBy: SortBy, newSortOrder: SortOrder) => {
    if (!baseUrl) return;
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('sortBy', newSortBy);
    params.set('sortOrder', newSortOrder);
    params.set('page', '1'); // Reset to first page
    
    router.push(`${baseUrl}?${params.toString()}`);
  };

  const handleSortByChange = async (value: SortBy) => {
    setSortBy(value);
    
    // Update URL immediately for better UX
    if (baseUrl) {
      updateURL(value, sortOrder);
    }
    
    // Notify parent component
    if (onSortChange) {
      onSortChange(value, sortOrder);
    }
    
    // Save preference in background (don't block UI)
    updateUserPreferences(value, sortOrder).catch((error) => {
      console.error('Failed to update sort preference:', error);
    });
  };

  const handleSortOrderToggle = async () => {
    const newOrder: SortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    
    // Update URL immediately for better UX
    if (baseUrl) {
      updateURL(sortBy, newOrder);
    }
    
    // Notify parent component
    if (onSortChange) {
      onSortChange(sortBy, newOrder);
    }
    
    // Save preference in background (don't block UI)
    updateUserPreferences(sortBy, newOrder).catch((error) => {
      console.error('Failed to update sort order:', error);
    });
  };

  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <Select value={sortBy} onValueChange={handleSortByChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="排序方式" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={handleSortOrderToggle}
        title={sortOrder === 'asc' ? '升序' : '降序'}
        aria-label={sortOrder === 'asc' ? '切换为降序' : '切换为升序'}
      >
        {sortOrder === 'asc' ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

/**
 * Compact version for mobile
 */
export function SortSelectorCompact({ 
  onSortChange, 
  className,
  initialSortBy = 'updatedAt',
  initialSortOrder = 'desc'
}: SortSelectorProps) {
  const [sortBy, setSortBy] = useState<SortBy>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);

  const cycleSortOption = () => {
    const currentIndex = SORT_OPTIONS.findIndex((opt) => opt.value === sortBy);
    const nextIndex = (currentIndex + 1) % SORT_OPTIONS.length;
    const nextSortBy = SORT_OPTIONS[nextIndex].value;
    
    setSortBy(nextSortBy);
    
    if (onSortChange) {
      onSortChange(nextSortBy, sortOrder);
    }
    
    // Save preference in background
    updateUserPreferences(nextSortBy, sortOrder).catch((error) => {
      console.error('Failed to update sort preference:', error);
    });
  };

  const toggleSortOrder = () => {
    const newOrder: SortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    
    if (onSortChange) {
      onSortChange(sortBy, newOrder);
    }
    
    // Save preference in background
    updateUserPreferences(sortBy, newOrder).catch((error) => {
      console.error('Failed to update sort order:', error);
    });
  };

  const currentLabel = SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label || '排序';

  return (
    <div className={`flex items-center gap-1 ${className ?? ''}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={cycleSortOption}
        className="text-xs"
      >
        <ArrowUpDown className="mr-1 h-3 w-3" />
        {currentLabel}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={toggleSortOrder}
      >
        {sortOrder === 'asc' ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}
