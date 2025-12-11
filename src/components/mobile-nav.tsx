"use client"

import { useState, useEffect, useId } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Home, FileText, Plus, Sparkles } from "lucide-react"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useGestureHandler } from "@/hooks/use-gesture-handler"

/**
 * 移动端导航组件
 * Mobile navigation with hamburger menu and side drawer
 * 
 * Features:
 * - Hamburger menu button for mobile devices
 * - Side drawer navigation with smooth animations
 * - Active route highlighting
 * - Touch-friendly tap targets (min 44x44px)
 * - Automatic close on navigation
 * - Overlay/backdrop for focus
 * - Edge swipe gestures to open/close (Requirements 12.1, 12.2)
 */
export function MobileNav() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // 手势处理器：边缘滑动打开/关闭侧边栏
  const { handlers, getEdgeSwipeDirection } = useGestureHandler({
    onSwipeRight: () => {
      // 从左边缘向右滑动打开侧边栏
      const edgeDirection = getEdgeSwipeDirection()
      if (edgeDirection === 'left' && !open) {
        setOpen(true)
      }
    },
    onSwipeLeft: () => {
      // 向左滑动关闭侧边栏
      if (open) {
        setOpen(false)
      }
    },
    edgeSwipeThreshold: 30, // 边缘检测阈值 30px
    minSwipeDistance: 50, // 最小滑动距离 50px
  })

  // 导航项配置
  const navItems = [
    {
      title: t('navigation.dashboard'),
      href: '/dashboard',
      icon: Home,
      description: '查看概览和统计',
    },
    {
      title: t('navigation.notes'),
      href: '/notes',
      icon: FileText,
      description: '浏览所有笔记',
    },
    {
      title: t('notes.newNote'),
      href: '/notes/new',
      icon: Plus,
      description: '创建新笔记',
    },
    {
      title: t('ai.aiFeatures'),
      href: '/ai',
      icon: Sparkles,
      description: 'AI智能功能',
    },
  ]

  // 路由变化时自动关闭抽屉
  useEffect(() => {
    const timer = setTimeout(() => setOpen(false), 0)
    return () => clearTimeout(timer)
  }, [pathname])

  // 阻止背景滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  // Render placeholder button during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden min-h-[44px] min-w-[44px]"
          aria-label={t('accessibility.openMenu')}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>
    )
  }

  return (
    <div {...handlers}>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden min-h-[44px] min-w-[44px]"
            aria-label={open ? t('accessibility.closeMenu') : t('accessibility.openMenu')}
            aria-expanded={open}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="text-left">{t('navigation.menu')}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-4" aria-label="主导航" role="navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || 
                           (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "min-h-[44px]", // 触摸友好的最小高度
                  "active:scale-95", // 点击反馈
                  isActive && "bg-accent text-accent-foreground font-medium shadow-sm"
                )}
                aria-current={isActive ? "page" : undefined}
                aria-label={`${item.title} - ${item.description}`}
              >
                <Icon 
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-transform",
                    isActive && "scale-110"
                  )} 
                  aria-hidden="true" 
                />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{item.title}</span>
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                </div>
              </Link>
            )
          })}
        </nav>
        
        {/* 底部提示 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-muted/50">
          <p className="text-xs text-muted-foreground text-center">
            {t('common.appName')} v1.0
          </p>
        </div>
      </SheetContent>
    </Sheet>
    </div>
  )
}
