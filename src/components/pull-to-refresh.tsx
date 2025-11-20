"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, RefreshCw } from "lucide-react"
import { t } from "@/lib/i18n"

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh?: () => Promise<void>
}

/**
 * 下拉刷新组件
 * Pull-to-refresh component for mobile
 */
export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const router = useRouter()
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const touchStartY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const maxPullDistance = 80
  const triggerDistance = 60

  const handleTouchStart = (e: React.TouchEvent) => {
    // 只在页面顶部时启用下拉刷新
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === 0 || window.scrollY > 0) return

    const touchY = e.touches[0].clientY
    const distance = touchY - touchStartY.current

    if (distance > 0) {
      setIsPulling(true)
      // 使用阻尼效果，距离越大阻力越大
      const dampedDistance = Math.min(distance * 0.5, maxPullDistance)
      setPullDistance(dampedDistance)
      
      // 防止页面滚动
      if (distance > 10) {
        e.preventDefault()
      }
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance >= triggerDistance && !isRefreshing) {
      setIsRefreshing(true)
      
      try {
        if (onRefresh) {
          await onRefresh()
        } else {
          // 默认刷新页面
          router.refresh()
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error('Refresh failed:', error)
      } finally {
        setIsRefreshing(false)
      }
    }

    setIsPulling(false)
    setPullDistance(0)
    touchStartY.current = 0
  }

  const getRefreshIcon = () => {
    if (isRefreshing) {
      return <Loader2 className="h-5 w-5 animate-spin" />
    }
    
    const rotation = Math.min((pullDistance / triggerDistance) * 180, 180)
    return (
      <RefreshCw 
        className="h-5 w-5 transition-transform" 
        style={{ transform: `rotate(${rotation}deg)` }}
      />
    )
  }

  const getRefreshText = () => {
    if (isRefreshing) {
      return t('common.loading')
    }
    if (pullDistance >= triggerDistance) {
      return '松开刷新'
    }
    return '下拉刷新'
  }

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* 刷新指示器 */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 md:hidden"
        style={{
          height: `${pullDistance}px`,
          opacity: isPulling || isRefreshing ? 1 : 0,
        }}
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {getRefreshIcon()}
          <span>{getRefreshText()}</span>
        </div>
      </div>

      {/* 内容区域 */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: `translateY(${isPulling || isRefreshing ? pullDistance : 0}px)`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
