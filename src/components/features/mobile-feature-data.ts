import { Smartphone, Zap, Globe } from "lucide-react"
import type { FeatureDetailData } from "./feature-detail-dialog"

// 1. PWA 应用功能详情
export const pwaFeature: FeatureDetailData = {
  title: "PWA 应用",
  description: "安装为原生应用，支持离线使用",
  icon: Smartphone,
  color: "text-pink-600",
  bgColor: "bg-pink-600/10",
  technologies: [
    {
      name: "next-pwa",
      description: "@ducanh2912/next-pwa 插件，自动生成 Service Worker",
      type: "library"
    },
    {
      name: "Service Worker",
      description: "拦截网络请求，实现离线缓存和后台同步",
      type: "api"
    },
    {
      name: "Web App Manifest",
      description: "定义应用图标、名称、启动画面等元数据",
      type: "api"
    },
    {
      name: "Cache API",
      description: "缓存静态资源和 API 响应，支持离线访问",
      type: "api"
    },
    {
      name: "IndexedDB",
      description: "本地数据库存储离线数据",
      type: "api"
    },
    {
      name: "beforeinstallprompt",
      description: "自定义安装提示，引导用户安装应用",
      type: "api"
    }
  ],
  coreFiles: [
    {
      path: "next.config.ts",
      description: "Next.js 配置，集成 PWA 插件"
    },
    {
      path: "public/manifest.json",
      description: "Web App Manifest 配置文件"
    },
    {
      path: "public/sw.js",
      description: "Service Worker 入口文件"
    },
    {
      path: "src/hooks/use-pwa.ts",
      description: "PWA 安装状态和提示管理 Hook"
    },
    {
      path: "src/components/mobile/install-prompt.tsx",
      description: "安装提示组件"
    }
  ],
  workflow: [
    "用户首次访问应用，浏览器下载 Service Worker",
    "Service Worker 安装并缓存核心静态资源",
    "后续访问优先从缓存加载，提升加载速度",
    "检测到可安装条件，触发 beforeinstallprompt 事件",
    "显示自定义安装提示，引导用户安装",
    "用户点击安装，应用添加到主屏幕",
    "离线时 Service Worker 返回缓存内容",
    "联网后自动同步离线期间的操作"
  ],
  codeSnippets: [
    {
      title: "PWA 配置 (next.config.ts)",
      language: "typescript",
      description: "Next.js PWA 插件配置",
      code: `import withPWA from "@ducanh2912/next-pwa"

const nextConfig = {
  // ... 其他配置
}

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\\/\\/.*\\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "images",
        expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^\\/api\\//,
      handler: "NetworkFirst",
      options: {
        cacheName: "api",
        expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
  ],
})(nextConfig)`
    },
    {
      title: "PWA 安装 Hook",
      language: "typescript",
      description: "管理 PWA 安装状态和提示",
      code: `"use client"

import { useState, useEffect, useCallback } from "react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // 检查是否已安装
    const checkInstalled = () => {
      const standalone = window.matchMedia("(display-mode: standalone)").matches
      setIsStandalone(standalone)
      setIsInstalled(standalone || (navigator as any).standalone === true)
    }
    checkInstalled()

    // 监听安装提示事件
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall)
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
  }, [])

  const promptInstall = useCallback(async () => {
    if (!installPrompt) return false
    
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    
    if (outcome === "accepted") {
      setIsInstalled(true)
      setInstallPrompt(null)
      return true
    }
    return false
  }, [installPrompt])

  return {
    canInstall: !!installPrompt && !isInstalled,
    isInstalled,
    isStandalone,
    promptInstall,
  }
}`
    },
    {
      title: "安装提示组件",
      language: "typescript",
      description: "引导用户安装 PWA 的 UI",
      code: `"use client"

import { usePWA } from "@/hooks/use-pwa"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, X } from "lucide-react"
import { useState } from "react"

export function InstallPrompt() {
  const { canInstall, promptInstall } = usePWA()
  const [dismissed, setDismissed] = useState(false)

  if (!canInstall || dismissed) return null

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg z-50 animate-in slide-in-from-bottom">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold">安装应用</h4>
            <p className="text-sm text-muted-foreground">
              安装到桌面，获得更好的体验
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={promptInstall}>
                安装
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
                稍后
              </Button>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}`
    }
  ],
  keyFunctions: [
    "navigator.serviceWorker.register()",
    "beforeinstallprompt",
    "installPrompt.prompt()",
    "caches.open()",
    "cache.addAll()",
    "matchMedia('(display-mode: standalone)')"
  ]
}


// 2. 加载动画功能详情
export const loadingAnimationFeature: FeatureDetailData = {
  title: "加载动画",
  description: "优雅的加载动画系统，提升用户体验",
  icon: Zap,
  color: "text-amber-600",
  bgColor: "bg-amber-600/10",
  technologies: [
    {
      name: "Framer Motion",
      description: "React 动画库，实现流畅的加载动画",
      type: "library"
    },
    {
      name: "CSS Keyframes",
      description: "纯 CSS 动画，性能优异",
      type: "pattern"
    },
    {
      name: "React Suspense",
      description: "配合 Suspense 显示加载状态",
      type: "pattern"
    },
    {
      name: "骨架屏",
      description: "内容占位符，减少布局抖动",
      type: "component"
    },
    {
      name: "动画变体",
      description: "Orbit、Pulse、Dots 等多种样式可选",
      type: "pattern"
    },
    {
      name: "主题适配",
      description: "自动适配深色/浅色主题",
      type: "pattern"
    }
  ],
  coreFiles: [
    {
      path: "src/components/loading/loading-spinner.tsx",
      description: "通用加载动画组件，支持多种样式"
    },
    {
      path: "src/components/loading/skeleton.tsx",
      description: "骨架屏组件，内容加载占位"
    },
    {
      path: "src/components/loading/page-loading.tsx",
      description: "页面级加载动画"
    },
    {
      path: "src/app/loading.tsx",
      description: "Next.js 全局加载状态"
    },
    {
      path: "src/hooks/use-loading.tsx",
      description: "加载状态管理 Hook"
    }
  ],
  workflow: [
    "用户触发页面导航或数据请求",
    "检测到加载状态，显示对应动画",
    "根据配置选择动画样式（Orbit/Pulse/Dots）",
    "动画组件渲染，开始播放",
    "数据加载完成，动画淡出",
    "内容渐入显示，过渡流畅",
    "骨架屏用于列表/卡片等复杂布局",
    "支持自定义动画时长和颜色"
  ],
  codeSnippets: [
    {
      title: "加载动画组件",
      language: "typescript",
      description: "支持多种样式的加载动画",
      code: `"use client"

import { cn } from "@/lib/utils"

type LoadingVariant = "orbit" | "pulse" | "dots" | "spinner"

interface LoadingSpinnerProps {
  variant?: LoadingVariant
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingSpinner({
  variant = "orbit",
  size = "md",
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  if (variant === "orbit") {
    return (
      <div className={cn("relative", sizeClasses[size], className)}>
        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
      </div>
    )
  }

  if (variant === "pulse") {
    return (
      <div className={cn("flex gap-1", className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "rounded-full bg-primary animate-pulse",
              size === "sm" ? "w-1.5 h-1.5" : size === "md" ? "w-2 h-2" : "w-3 h-3"
            )}
            style={{ animationDelay: \`\${i * 150}ms\` }}
          />
        ))}
      </div>
    )
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex gap-1", className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "rounded-full bg-primary",
              size === "sm" ? "w-1.5 h-1.5" : size === "md" ? "w-2 h-2" : "w-3 h-3"
            )}
            style={{
              animation: "bounce 1s infinite",
              animationDelay: \`\${i * 100}ms\`,
            }}
          />
        ))}
      </div>
    )
  }

  // spinner
  return (
    <div
      className={cn(
        "rounded-full border-2 border-muted border-t-primary animate-spin",
        sizeClasses[size],
        className
      )}
    />
  )
}`
    },
    {
      title: "骨架屏组件",
      language: "typescript",
      description: "内容加载时的占位组件",
      code: `import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
    />
  )
}

// 笔记卡片骨架屏
export function NoteCardSkeleton() {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  )
}

// 笔记列表骨架屏
export function NoteListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <NoteCardSkeleton key={i} />
      ))}
    </div>
  )
}`
    },
    {
      title: "页面加载动画",
      language: "typescript",
      description: "全屏加载状态组件",
      code: `"use client"

import { LoadingSpinner } from "./loading-spinner"
import { motion } from "framer-motion"

interface PageLoadingProps {
  message?: string
}

export function PageLoading({ message = "加载中..." }: PageLoadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50"
    >
      <LoadingSpinner variant="orbit" size="lg" />
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 text-muted-foreground"
      >
        {message}
      </motion.p>
    </motion.div>
  )
}

// Next.js loading.tsx 使用
export default function Loading() {
  return <PageLoading />
}`
    }
  ],
  keyFunctions: [
    "animate-spin",
    "animate-pulse",
    "motion.div",
    "AnimatePresence",
    "Suspense",
    "CSS keyframes",
    "transition-delay"
  ]
}

// 3. 响应式设计功能详情
export const responsiveDesignFeature: FeatureDetailData = {
  title: "响应式设计",
  description: "完美适配桌面、平板、手机各种设备",
  icon: Globe,
  color: "text-teal-500",
  bgColor: "bg-teal-500/10",
  technologies: [
    {
      name: "Tailwind CSS",
      description: "响应式断点类，快速实现多端适配",
      type: "library"
    },
    {
      name: "CSS Grid",
      description: "灵活的网格布局系统",
      type: "pattern"
    },
    {
      name: "Flexbox",
      description: "弹性盒子布局，自适应排列",
      type: "pattern"
    },
    {
      name: "Container Queries",
      description: "基于容器尺寸的响应式设计",
      type: "pattern"
    },
    {
      name: "移动优先",
      description: "Mobile-first 设计理念",
      type: "pattern"
    },
    {
      name: "触摸优化",
      description: "触摸友好的交互区域和手势支持",
      type: "pattern"
    }
  ],
  coreFiles: [
    {
      path: "tailwind.config.js",
      description: "Tailwind 配置，定义响应式断点"
    },
    {
      path: "src/components/mobile/mobile-nav.tsx",
      description: "移动端导航组件"
    },
    {
      path: "src/components/dashboard/responsive-sidebar.tsx",
      description: "响应式侧边栏，移动端可折叠"
    },
    {
      path: "src/components/notes/note-grid.tsx",
      description: "笔记网格，自适应列数"
    },
    {
      path: "src/hooks/use-media-query.ts",
      description: "媒体查询 Hook，检测设备类型"
    }
  ],
  workflow: [
    "使用 Mobile-first 方式编写样式",
    "基础样式针对移动端设计",
    "使用 md: lg: xl: 断点添加大屏样式",
    "侧边栏在移动端默认隐藏，可滑出",
    "笔记网格根据屏幕宽度调整列数",
    "触摸设备增大点击区域（44px 最小）",
    "使用 useMediaQuery 检测设备类型",
    "针对不同设备优化交互方式"
  ],
  codeSnippets: [
    {
      title: "响应式网格布局",
      language: "typescript",
      description: "自适应列数的笔记网格",
      code: `// 笔记网格组件
export function NoteGrid({ notes }: { notes: Note[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  )
}

// Tailwind 断点说明：
// 默认: 1列 (< 640px，手机)
// sm:  2列 (≥ 640px，大手机/小平板)
// lg:  3列 (≥ 1024px，平板/小桌面)
// xl:  4列 (≥ 1280px，桌面)`
    },
    {
      title: "媒体查询 Hook",
      language: "typescript",
      description: "检测设备类型和屏幕尺寸",
      code: `"use client"

import { useState, useEffect } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener("change", listener)
    return () => media.removeEventListener("change", listener)
  }, [query])

  return matches
}

// 预设断点 Hooks
export function useIsMobile() {
  return useMediaQuery("(max-width: 639px)")
}

export function useIsTablet() {
  return useMediaQuery("(min-width: 640px) and (max-width: 1023px)")
}

export function useIsDesktop() {
  return useMediaQuery("(min-width: 1024px)")
}

// 使用示例
function MyComponent() {
  const isMobile = useIsMobile()
  
  return isMobile ? <MobileView /> : <DesktopView />
}`
    },
    {
      title: "响应式侧边栏",
      language: "typescript",
      description: "移动端可折叠的侧边栏",
      code: `"use client"

import { useState } from "react"
import { useIsMobile } from "@/hooks/use-media-query"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

export function ResponsiveSidebar({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  // 桌面端：固定侧边栏
  if (!isMobile) {
    return (
      <aside className="w-64 border-r h-screen sticky top-0 overflow-y-auto">
        {children}
      </aside>
    )
  }

  // 移动端：抽屉式侧边栏
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-40">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        {children}
      </SheetContent>
    </Sheet>
  )
}

// 触摸友好的按钮
function TouchFriendlyButton({ children, ...props }) {
  return (
    <Button
      {...props}
      className="min-h-[44px] min-w-[44px]" // 最小触摸区域
    >
      {children}
    </Button>
  )
}`
    }
  ],
  keyFunctions: [
    "useMediaQuery()",
    "window.matchMedia()",
    "grid-cols-{n}",
    "sm: md: lg: xl:",
    "Sheet (抽屉组件)",
    "min-h-[44px]",
    "sticky top-0"
  ]
}

// 导出所有移动端功能详情
export const mobileFeatureDetails: Record<string, FeatureDetailData> = {
  "pwa": pwaFeature,
  "loading-animation": loadingAnimationFeature,
  "responsive-design": responsiveDesignFeature,
}
