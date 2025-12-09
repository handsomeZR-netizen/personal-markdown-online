"use client"

import { useCallback, useRef, useState } from "react"

/**
 * 手势方向类型
 * Gesture direction types
 */
export type SwipeDirection = 'left' | 'right' | 'up' | 'down'

/**
 * 手势处理器配置
 * Gesture handler configuration
 */
export interface GestureHandlerConfig {
  // 滑动手势配置
  onSwipe?: (direction: SwipeDirection) => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  
  // 下拉刷新配置
  onPullToRefresh?: () => Promise<void>
  pullToRefreshThreshold?: number
  
  // 双击配置
  onDoubleTap?: () => void
  doubleTapDelay?: number
  
  // 通用配置
  minSwipeDistance?: number
  edgeSwipeThreshold?: number // 边缘滑动检测阈值
}

/**
 * 触摸位置
 * Touch position
 */
interface TouchPosition {
  x: number
  y: number
  timestamp: number
}

/**
 * 手势状态
 * Gesture state
 */
interface GestureState {
  isPulling: boolean
  pullDistance: number
  isRefreshing: boolean
}

/**
 * 手势处理器 Hook
 * Comprehensive gesture handler hook for mobile interactions
 * 
 * @param config - Gesture handler configuration
 * @returns Gesture handlers and state
 */
export function useGestureHandler(config: GestureHandlerConfig = {}) {
  const {
    onSwipe,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPullToRefresh,
    pullToRefreshThreshold = 60,
    onDoubleTap,
    doubleTapDelay = 300,
    minSwipeDistance = 50,
    edgeSwipeThreshold = 30,
  } = config

  // 触摸状态
  const touchStart = useRef<TouchPosition | null>(null)
  const touchEnd = useRef<TouchPosition | null>(null)
  const lastTapTime = useRef<number>(0)
  const touchStartY = useRef<number>(0)

  // 下拉刷新状态
  const [gestureState, setGestureState] = useState<GestureState>({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false,
  })

  /**
   * 检测是否为边缘滑动
   * Check if swipe starts from edge
   */
  const isEdgeSwipe = useCallback((x: number): 'left' | 'right' | null => {
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 0
    if (x <= edgeSwipeThreshold) return 'left'
    if (x >= windowWidth - edgeSwipeThreshold) return 'right'
    return null
  }, [edgeSwipeThreshold])

  /**
   * 处理触摸开始
   * Handle touch start
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    const now = Date.now()
    
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: now,
    }
    touchEnd.current = null

    // 检测双击
    if (onDoubleTap && now - lastTapTime.current < doubleTapDelay) {
      onDoubleTap()
      lastTapTime.current = 0 // 重置以避免三击触发
    } else {
      lastTapTime.current = now
    }

    // 下拉刷新：只在页面顶部时启用
    if (onPullToRefresh && window.scrollY === 0) {
      touchStartY.current = touch.clientY
    }
  }, [onDoubleTap, doubleTapDelay, onPullToRefresh])

  /**
   * 处理触摸移动
   * Handle touch move
   */
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    
    touchEnd.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    }

    // 下拉刷新逻辑
    if (onPullToRefresh && touchStartY.current > 0 && window.scrollY === 0) {
      const distance = touch.clientY - touchStartY.current

      if (distance > 0) {
        setGestureState(prev => ({
          ...prev,
          isPulling: true,
          pullDistance: Math.min(distance * 0.5, 80), // 阻尼效果
        }))

        // 防止页面滚动
        if (distance > 10) {
          e.preventDefault()
        }
      }
    }
  }, [onPullToRefresh])

  /**
   * 处理触摸结束
   * Handle touch end
   */
  const handleTouchEnd = useCallback(async () => {
    if (!touchStart.current || !touchEnd.current) {
      // 重置下拉刷新状态
      if (gestureState.isPulling) {
        if (gestureState.pullDistance >= pullToRefreshThreshold && !gestureState.isRefreshing) {
          setGestureState(prev => ({ ...prev, isRefreshing: true }))
          
          try {
            if (onPullToRefresh) {
              await onPullToRefresh()
            }
          } catch (error) {
            console.error('Pull to refresh failed:', error)
          } finally {
            setGestureState({
              isPulling: false,
              pullDistance: 0,
              isRefreshing: false,
            })
          }
        } else {
          setGestureState({
            isPulling: false,
            pullDistance: 0,
            isRefreshing: false,
          })
        }
        touchStartY.current = 0
      }
      return
    }

    const deltaX = touchStart.current.x - touchEnd.current.x
    const deltaY = touchStart.current.y - touchEnd.current.y
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    // 判断是水平还是垂直滑动
    const isHorizontalSwipe = absDeltaX > absDeltaY

    if (isHorizontalSwipe && absDeltaX > minSwipeDistance) {
      // 水平滑动
      const direction: SwipeDirection = deltaX > 0 ? 'left' : 'right'
      
      // 触发通用滑动回调
      onSwipe?.(direction)
      
      // 触发特定方向回调
      if (direction === 'left') {
        onSwipeLeft?.()
      } else {
        onSwipeRight?.()
      }
    } else if (!isHorizontalSwipe && absDeltaY > minSwipeDistance) {
      // 垂直滑动
      const direction: SwipeDirection = deltaY > 0 ? 'up' : 'down'
      
      // 触发通用滑动回调
      onSwipe?.(direction)
      
      // 触发特定方向回调
      if (direction === 'up') {
        onSwipeUp?.()
      } else {
        onSwipeDown?.()
      }
    }

    // 处理下拉刷新
    if (gestureState.isPulling) {
      if (gestureState.pullDistance >= pullToRefreshThreshold && !gestureState.isRefreshing) {
        setGestureState(prev => ({ ...prev, isRefreshing: true }))
        
        try {
          if (onPullToRefresh) {
            await onPullToRefresh()
          }
        } catch (error) {
          console.error('Pull to refresh failed:', error)
        } finally {
          setGestureState({
            isPulling: false,
            pullDistance: 0,
            isRefreshing: false,
          })
        }
      } else {
        setGestureState({
          isPulling: false,
          pullDistance: 0,
          isRefreshing: false,
        })
      }
      touchStartY.current = 0
    }

    // 重置触摸状态
    touchStart.current = null
    touchEnd.current = null
  }, [
    onSwipe,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPullToRefresh,
    minSwipeDistance,
    pullToRefreshThreshold,
    gestureState,
  ])

  /**
   * 获取边缘滑动方向
   * Get edge swipe direction if applicable
   */
  const getEdgeSwipeDirection = useCallback((): 'left' | 'right' | null => {
    if (!touchStart.current) return null
    return isEdgeSwipe(touchStart.current.x)
  }, [isEdgeSwipe])

  return {
    // 手势处理器
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    
    // 手势状态
    state: gestureState,
    
    // 工具函数
    getEdgeSwipeDirection,
    isEdgeSwipe,
  }
}
