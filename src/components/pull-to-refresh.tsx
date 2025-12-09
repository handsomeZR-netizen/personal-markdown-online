"use client"

import { useRouter } from "next/navigation"
import { Loader2, RefreshCw } from "lucide-react"
import { t } from "@/lib/i18n"
import { useGestureHandler } from "@/hooks/use-gesture-handler"

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh?: () => Promise<void>
}

/**
 * 下拉刷新组件
 * Pull-to-refresh component for mobile (Requirement 12.3)
 * 
 * Features:
 * - Pull-down gesture detection
 * - Visual refresh indicator with rotation animation
 * - Customizable refresh callback
 * - Damping effect for smooth UX
 * - Automatic page refresh fallback
 */
export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const router = useRouter()

  const maxPullDistance = 80
  const triggerDistance = 60

  // 使用手势处理器处理下拉刷新
  const { handlers, state } = useGestureHandler({
    onPullToRefresh: async () => {
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
      }
    },
    pullToRefreshThreshold: triggerDistance,
  })

  const getRefreshIcon = () => {
    if (state.isRefreshing) {
      return <Loader2 className="h-5 w-5 animate-spin" />
    }
    
    const rotation = Math.min((state.pullDistance / triggerDistance) * 180, 180)
    return (
      <RefreshCw 
        className="h-5 w-5 transition-transform" 
        style={{ transform: `rotate(${rotation}deg)` }}
      />
    )
  }

  const getRefreshText = () => {
    if (state.isRefreshing) {
      return t('common.loading')
    }
    if (state.pullDistance >= triggerDistance) {
      return '松开刷新'
    }
    return '下拉刷新'
  }

  return (
    <div
      {...handlers}
      className="relative"
    >
      {/* 刷新指示器 */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 md:hidden z-50"
        style={{
          height: `${state.pullDistance}px`,
          opacity: state.isPulling || state.isRefreshing ? 1 : 0,
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
          transform: `translateY(${state.isPulling || state.isRefreshing ? state.pullDistance : 0}px)`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
