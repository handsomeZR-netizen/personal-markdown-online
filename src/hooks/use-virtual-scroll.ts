'use client';

/**
 * 虚拟滚动 Hook
 * 提供虚拟滚动的状态管理和计算逻辑
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseVirtualScrollOptions {
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

interface VirtualScrollResult {
  visibleRange: { start: number; end: number };
  totalHeight: number;
  offsetY: number;
  scrollToIndex: (index: number) => void;
  handleScroll: (scrollTop: number) => void;
}

/**
 * 虚拟滚动 Hook
 * 计算可见范围和滚动位置
 */
export function useVirtualScroll({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 3,
}: UseVirtualScrollOptions): VirtualScrollResult {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const scrollTopRef = useRef(0);

  // 计算可见范围
  const calculateVisibleRange = useCallback(
    (scrollTop: number) => {
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const visibleCount = Math.ceil(containerHeight / itemHeight);
      const end = Math.min(itemCount, start + visibleCount + overscan * 2);

      return { start, end };
    },
    [itemCount, itemHeight, containerHeight, overscan]
  );

  // 处理滚动
  const handleScroll = useCallback(
    (scrollTop: number) => {
      scrollTopRef.current = scrollTop;
      const newRange = calculateVisibleRange(scrollTop);
      
      // 只在范围变化时更新状态
      setVisibleRange((prev) => {
        if (prev.start !== newRange.start || prev.end !== newRange.end) {
          return newRange;
        }
        return prev;
      });
    },
    [calculateVisibleRange]
  );

  // 滚动到指定索引
  const scrollToIndex = useCallback(
    (index: number) => {
      const scrollTop = index * itemHeight;
      scrollTopRef.current = scrollTop;
      handleScroll(scrollTop);
    },
    [itemHeight, handleScroll]
  );

  // 初始化可见范围
  useEffect(() => {
    const range = calculateVisibleRange(scrollTopRef.current);
    setVisibleRange(range);
  }, [calculateVisibleRange]);

  // 计算总高度和偏移量
  const totalHeight = itemCount * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return {
    visibleRange,
    totalHeight,
    offsetY,
    scrollToIndex,
    handleScroll,
  };
}

/**
 * 动态高度虚拟滚动 Hook
 * 支持不同高度的项
 */
interface UseDynamicVirtualScrollOptions {
  itemCount: number;
  estimatedItemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useDynamicVirtualScroll({
  itemCount,
  estimatedItemHeight,
  containerHeight,
  overscan = 3,
}: UseDynamicVirtualScrollOptions) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const itemHeightsRef = useRef<Map<number, number>>(new Map());
  const itemPositionsRef = useRef<Map<number, number>>(new Map());

  // 设置项的实际高度
  const setItemHeight = useCallback((index: number, height: number) => {
    itemHeightsRef.current.set(index, height);
    
    // 重新计算所有项的位置
    let currentTop = 0;
    for (let i = 0; i < itemCount; i++) {
      itemPositionsRef.current.set(i, currentTop);
      const itemHeight = itemHeightsRef.current.get(i) || estimatedItemHeight;
      currentTop += itemHeight;
    }
  }, [itemCount, estimatedItemHeight]);

  // 获取项的位置
  const getItemPosition = useCallback((index: number): number => {
    return itemPositionsRef.current.get(index) || index * estimatedItemHeight;
  }, [estimatedItemHeight]);

  // 计算可见范围
  const calculateVisibleRange = useCallback(
    (scrollTop: number) => {
      let start = 0;
      let end = itemCount;

      // 二分查找起始索引
      let left = 0;
      let right = itemCount - 1;
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const position = getItemPosition(mid);
        
        if (position < scrollTop) {
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }
      start = Math.max(0, left - overscan);

      // 查找结束索引
      let currentTop = getItemPosition(start);
      end = start;
      while (end < itemCount && currentTop < scrollTop + containerHeight) {
        const height = itemHeightsRef.current.get(end) || estimatedItemHeight;
        currentTop += height;
        end++;
      }
      end = Math.min(itemCount, end + overscan);

      return { start, end };
    },
    [itemCount, containerHeight, overscan, getItemPosition, estimatedItemHeight]
  );

  // 处理滚动
  const handleScroll = useCallback(
    (scrollTop: number) => {
      const newRange = calculateVisibleRange(scrollTop);
      setVisibleRange((prev) => {
        if (prev.start !== newRange.start || prev.end !== newRange.end) {
          return newRange;
        }
        return prev;
      });
    },
    [calculateVisibleRange]
  );

  // 计算总高度
  const totalHeight = Array.from({ length: itemCount }, (_, i) => 
    itemHeightsRef.current.get(i) || estimatedItemHeight
  ).reduce((sum, height) => sum + height, 0);

  const offsetY = getItemPosition(visibleRange.start);

  return {
    visibleRange,
    totalHeight,
    offsetY,
    setItemHeight,
    getItemPosition,
    handleScroll,
  };
}
