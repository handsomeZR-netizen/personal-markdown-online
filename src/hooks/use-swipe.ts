"use client"

import { useEffect, useRef, useState } from "react"

interface SwipeInput {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  minSwipeDistance?: number
}

interface TouchPosition {
  x: number
  y: number
}

/**
 * 滑动手势Hook
 * Swipe gesture hook for touch interactions
 */
export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  minSwipeDistance = 50,
}: SwipeInput) {
  const [touchStart, setTouchStart] = useState<TouchPosition | null>(null)
  const [touchEnd, setTouchEnd] = useState<TouchPosition | null>(null)

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    })
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    })
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distanceX = touchStart.x - touchEnd.x
    const distanceY = touchStart.y - touchEnd.y
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY)

    if (isHorizontalSwipe) {
      // 水平滑动
      if (distanceX > minSwipeDistance) {
        // 向左滑动
        onSwipeLeft?.()
      } else if (distanceX < -minSwipeDistance) {
        // 向右滑动
        onSwipeRight?.()
      }
    } else {
      // 垂直滑动
      if (distanceY > minSwipeDistance) {
        // 向上滑动
        onSwipeUp?.()
      } else if (distanceY < -minSwipeDistance) {
        // 向下滑动
        onSwipeDown?.()
      }
    }
  }

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  }
}
