'use client';

import { useState, useEffect } from 'react';
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
import { getUserPreferences, updateUserPreferences } from '@/lib/actions/preferences';
import { toast } from 'sonner';

interface SortSelectorProps {
  onSortChange?: (sortBy: SortBy, sortOrder: SortOrder) => void;
  baseUrl?: string; // For URL-based sorting (backward compatibility)
  className?: string;
}

/**
 * SortSelector component for selecting sorting options
 * Validates: Requirements 22.1, 22.5
 */
export function SortSelector({ onSortChange, baseUrl, className }: SortSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sortBy, setSortBy] = useState<SortBy>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isLoading, setIsLoading] = useState(true);

  // Load user preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await getUserPreferences();
      setSortBy(prefs.sortBy as SortBy);
      setSortOrder(prefs.sortOrder as SortOrder);
      
      // Notify parent component
      if (onSortChange) {
        onSortChange(prefs.sortBy as SortBy, prefs.sortOrder as SortOrder);
      }
      
      // Update URL if baseUrl is provided
      if (baseUrl) {
        updateURL(prefs.sortBy as SortBy, prefs.sortOrder as SortOrder);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      toast.error('加载排序偏好失败');
    } finally {
      setIsLoading(false);
    }
  };

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
    
    try {
      await updateUserPreferences(value, sortOrder);
      
      // Notify parent component
      if (onSortChange) {
        onSortChange(value, sortOrder);
      }
      
      // Update URL if baseUrl is provided
      if (baseUrl) {
        updateURL(value, sortOrder);
      }
      
      toast.success('排序方式已更新');
    } catch (error) {
      console.error('Failed to update sort preference:', error);
      toast.error('更新排序方式失败');
    }
  };

  const handleSortOrderToggle = async () => {
    const newOrder: SortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    
    try {
      await updateUserPreferences(sortBy, newOrder);
      
      // Notify parent component
      if (onSortChange) {
        onSortChange(sortBy, newOrder);
      }
      
      // Update URL if baseUrl is provided
      if (baseUrl) {
        updateURL(sortBy, newOrder);
      }
      
      toast.success('排序顺序已更新');
    } catch (error) {
      console.error('Failed to update sort order:', error);
      toast.error('更新排序顺序失败');
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-10 animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
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
export function SortSelectorCompact({ onSortChange, className }: SortSelectorProps) {
  const [sortBy, setSortBy] = useState<SortBy>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await getUserPreferences();
      setSortBy(prefs.sortBy as SortBy);
      setSortOrder(prefs.sortOrder as SortOrder);
      
      if (onSortChange) {
        onSortChange(prefs.sortBy as SortBy, prefs.sortOrder as SortOrder);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cycleSortOption = async () => {
    const currentIndex = SORT_OPTIONS.findIndex((opt) => opt.value === sortBy);
    const nextIndex = (currentIndex + 1) % SORT_OPTIONS.length;
    const nextSortBy = SORT_OPTIONS[nextIndex].value;
    
    setSortBy(nextSortBy);
    
    try {
      await updateUserPreferences(nextSortBy, sortOrder);
      
      if (onSortChange) {
        onSortChange(nextSortBy, sortOrder);
      }
    } catch (error) {
      console.error('Failed to update sort preference:', error);
    }
  };

  const toggleSortOrder = async () => {
    const newOrder: SortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    
    try {
      await updateUserPreferences(sortBy, newOrder);
      
      if (onSortChange) {
        onSortChange(sortBy, newOrder);
      }
    } catch (error) {
      console.error('Failed to update sort order:', error);
    }
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className={className}>
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    );
  }

  const currentLabel = SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label || '排序';

  return (
    <div className={`flex items-center gap-1 ${className}`}>
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
