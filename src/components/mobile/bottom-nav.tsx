"use client"

import { usePathname, useRouter } from "next/navigation"
import { Home, Search, Plus, Grid } from "lucide-react"
import { cn } from "@/lib/utils"
import { t } from "@/lib/i18n"
import { useState, useTransition } from "react"
import { InlineLoader } from "@/components/ui/with-loading"

/**
 * 移动端底部导航栏组件
 * Mobile bottom navigation bar with 4 tabs
 * 
 * Features:
 * - 4 tabs: Notes, Search, New, Folders
 * - Active tab highlighting
 * - Touch-friendly tap targets (min 44x44px)
 * - Fixed position at bottom
 * - Smooth transitions
 * - Validates: Requirements 13.1, 13.2, 13.3
 */

interface BottomNavProps {
  className?: string
  hidden?: boolean
}

export function BottomNav({ className, hidden = false }: BottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string>("")
  const [isPending, startTransition] = useTransition()
  const [loadingTab, setLoadingTab] = useState<string>("")

  // 导航项配置
  const navItems = [
    {
      id: "notes",
      label: "首页",
      icon: Home,
      href: "/dashboard",
      ariaLabel: "返回首页",
    },
    {
      id: "search",
      label: t('search.search'),
      icon: Search,
      href: "/notes?search=true",
      ariaLabel: "搜索笔记",
    },
    {
      id: "new",
      label: t('notes.newNote'),
      icon: Plus,
      href: "/notes/new",
      ariaLabel: "创建新笔记",
    },
    {
      id: "features",
      label: "功能",
      icon: Grid,
      href: "/features",
      ariaLabel: "查看所有功能",
    },
  ]

  // 判断当前活动标签
  const isActive = (href: string, id: string) => {
    if (id === "new") {
      return pathname === "/notes/new"
    }
    if (id === "search") {
      return pathname.includes("search=true")
    }
    if (id === "features") {
      return pathname === "/features"
    }
    if (id === "notes") {
      return pathname === "/dashboard" || pathname === "/"
    }
    return pathname === href
  }

  // 处理标签点击
  const handleTabClick = (item: typeof navItems[0]) => {
    setActiveTab(item.id)
    setLoadingTab(item.id)
    startTransition(() => {
      router.push(item.href)
      // 导航完成后清除加载状态
      setTimeout(() => setLoadingTab(""), 500)
    })
  }

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40",
        "bg-background/95 backdrop-blur-lg border-t border-border",
        "lg:hidden", // 仅在移动端显示
        "transition-transform duration-300 ease-in-out",
        hidden && "translate-y-full", // 隐藏时向下滑出
        className
      )}
      role="navigation"
      aria-label="底部导航"
    >
      <div className="flex items-center justify-around h-16 px-2 safe-area-inset-bottom">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href, item.id)

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item)}
              className={cn(
                "flex flex-col items-center justify-center",
                "min-w-[64px] min-h-[44px] px-3 py-2",
                "rounded-lg transition-all duration-200",
                "hover:bg-accent/50",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "active:scale-95",
                active && "text-primary"
              )}
              aria-label={item.ariaLabel}
              aria-current={active ? "page" : undefined}
            >
              {loadingTab === item.id ? (
                <div className="h-6 w-6 mb-1 flex items-center justify-center">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <Icon
                  className={cn(
                    "h-6 w-6 mb-1 transition-all duration-200",
                    active && "scale-110"
                  )}
                  aria-hidden="true"
                />
              )}
              <span
                className={cn(
                  "text-xs font-medium transition-all duration-200",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
