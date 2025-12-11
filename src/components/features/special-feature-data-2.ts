import { Bookmark, Star, BarChart3, Bell, Code } from "lucide-react"
import type { FeatureDetailData } from "./feature-detail-dialog"

/**
 * 特色功能详细数据配置（第二组）
 * 收藏夹、星标笔记、数据统计、提醒通知、代码片段
 */

// 1. 收藏夹功能详情
export const favoritesFeature: FeatureDetailData = {
  title: "收藏夹",
  description: "收藏重要笔记，快速访问常用内容",
  icon: Bookmark,
  color: "text-amber-700",
  bgColor: "bg-amber-700/10",
  technologies: [
    {
      name: "Prisma 关系模型",
      description: "用户与笔记的多对多收藏关系",
      type: "pattern"
    },
    {
      name: "乐观更新",
      description: "点击收藏立即更新 UI，后台异步同步",
      type: "pattern"
    },
    {
      name: "React Query",
      description: "管理收藏状态缓存和自动刷新",
      type: "library"
    },
    {
      name: "Server Actions",
      description: "Next.js 服务端操作处理收藏逻辑",
      type: "api"
    },
    {
      name: "虚拟列表",
      description: "大量收藏时使用虚拟滚动优化性能",
      type: "pattern"
    },
    {
      name: "快捷键支持",
      description: "Ctrl+D 快速收藏/取消收藏当前笔记",
      type: "pattern"
    }
  ],
  coreFiles: [
    {
      path: "src/lib/actions/favorites.ts",
      description: "收藏相关的 Server Actions"
    },
    {
      path: "src/components/notes/favorite-button.tsx",
      description: "收藏按钮组件，支持动画效果"
    },
    {
      path: "src/app/dashboard/favorites/page.tsx",
      description: "收藏夹页面，展示所有收藏笔记"
    },
    {
      path: "src/hooks/use-favorites.ts",
      description: "收藏状态管理 Hook"
    },
    {
      path: "prisma/schema.prisma",
      description: "数据库模型定义（Favorite 表）"
    }
  ],
  workflow: [
    "用户点击笔记卡片上的收藏按钮",
    "触发乐观更新，UI 立即显示收藏状态",
    "调用 Server Action 处理收藏请求",
    "验证用户身份和笔记访问权限",
    "在数据库中创建/删除收藏记录",
    "返回操作结果，失败时回滚 UI 状态",
    "收藏夹页面自动刷新显示最新列表",
    "支持按收藏时间或笔记标题排序",
    "收藏数量显示在侧边栏导航中"
  ],
  codeSnippets: [
    {
      title: "收藏按钮组件",
      language: "typescript",
      description: "带动画效果的收藏切换按钮",
      code: `'use client'

import { useState } from 'react'
import { Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toggleFavorite } from '@/lib/actions/favorites'
import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  noteId: string
  isFavorited: boolean
  onToggle?: (isFavorited: boolean) => void
}

export function FavoriteButton({ noteId, isFavorited, onToggle }: FavoriteButtonProps) {
  const [optimisticFavorited, setOptimisticFavorited] = useState(isFavorited)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // 乐观更新
    const newState = !optimisticFavorited
    setOptimisticFavorited(newState)
    setIsAnimating(true)
    
    try {
      await toggleFavorite(noteId)
      onToggle?.(newState)
    } catch {
      // 回滚
      setOptimisticFavorited(!newState)
    } finally {
      setTimeout(() => setIsAnimating(false), 300)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={cn(
        "h-8 w-8 transition-all",
        optimisticFavorited && "text-amber-500",
        isAnimating && "scale-125"
      )}
    >
      <Bookmark
        className={cn(
          "h-4 w-4 transition-all",
          optimisticFavorited && "fill-current"
        )}
      />
    </Button>
  )
}`
    },
    {
      title: "收藏 Server Action",
      language: "typescript",
      description: "处理收藏/取消收藏逻辑",
      code: `'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function toggleFavorite(noteId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('未登录')
  }

  const userId = session.user.id

  // 检查是否已收藏
  const existing = await prisma.favorite.findUnique({
    where: {
      userId_noteId: { userId, noteId }
    }
  })

  if (existing) {
    // 取消收藏
    await prisma.favorite.delete({
      where: { id: existing.id }
    })
  } else {
    // 添加收藏
    await prisma.favorite.create({
      data: { userId, noteId }
    })
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/favorites')
  
  return { success: true, isFavorited: !existing }
}

export async function getFavorites() {
  const session = await auth()
  if (!session?.user?.id) return []

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      note: {
        select: {
          id: true,
          title: true,
          content: true,
          updatedAt: true,
          tags: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return favorites.map(f => f.note)
}`
    },
    {
      title: "收藏夹页面",
      language: "typescript",
      description: "展示用户收藏的所有笔记",
      code: `import { getFavorites } from '@/lib/actions/favorites'
import { NoteCard } from '@/components/notes/note-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Bookmark } from 'lucide-react'

export default async function FavoritesPage() {
  const favorites = await getFavorites()

  if (favorites.length === 0) {
    return (
      <EmptyState
        icon={Bookmark}
        title="暂无收藏"
        description="点击笔记上的书签图标添加收藏"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">收藏夹</h1>
        <span className="text-muted-foreground">
          {favorites.length} 篇笔记
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {favorites.map(note => (
          <NoteCard key={note.id} note={note} showFavorite />
        ))}
      </div>
    </div>
  )
}`
    }
  ],
  keyFunctions: [
    "toggleFavorite()",
    "getFavorites()",
    "prisma.favorite.create()",
    "prisma.favorite.delete()",
    "revalidatePath()",
    "useOptimistic()",
    "Ctrl+D 快捷键"
  ]
}

// 2. 星标笔记功能详情
export const starredNotesFeature: FeatureDetailData = {
  title: "星标笔记",
  description: "标记重要笔记，置顶显示",
  icon: Star,
  color: "text-yellow-600",
  bgColor: "bg-yellow-600/10",
  technologies: [
    {
      name: "Note 模型扩展",
      description: "在笔记表中添加 isStarred 和 starredAt 字段",
      type: "pattern"
    },
    {
      name: "排序优先级",
      description: "星标笔记在列表中优先显示",
      type: "pattern"
    },
    {
      name: "动画效果",
      description: "星标切换时的星星动画",
      type: "component"
    },
    {
      name: "批量操作",
      description: "支持批量添加/移除星标",
      type: "pattern"
    },
    {
      name: "筛选器集成",
      description: "可按星标状态筛选笔记列表",
      type: "pattern"
    },
    {
      name: "拖拽排序",
      description: "星标笔记支持手动拖拽排序",
      type: "pattern"
    }
  ],
  coreFiles: [
    {
      path: "src/lib/actions/notes.ts",
      description: "笔记操作 Actions，包含星标逻辑"
    },
    {
      path: "src/components/notes/star-button.tsx",
      description: "星标按钮组件，带动画效果"
    },
    {
      path: "src/components/notes/note-list.tsx",
      description: "笔记列表，星标笔记置顶显示"
    },
    {
      path: "src/hooks/use-note-sorting.ts",
      description: "笔记排序 Hook，处理星标优先"
    },
    {
      path: "prisma/schema.prisma",
      description: "Note 模型的 isStarred 字段"
    }
  ],
  workflow: [
    "用户点击笔记的星标按钮",
    "触发星标切换动画（星星旋转放大）",
    "乐观更新本地状态",
    "调用 API 更新数据库中的 isStarred 字段",
    "同时记录 starredAt 时间戳",
    "笔记列表重新排序，星标笔记置顶",
    "星标笔记按 starredAt 降序排列",
    "非星标笔记按原有排序规则排列",
    "侧边栏显示星标笔记数量徽章"
  ],
  codeSnippets: [
    {
      title: "星标按钮组件",
      language: "typescript",
      description: "带旋转动画的星标切换",
      code: `'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toggleStar } from '@/lib/actions/notes'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface StarButtonProps {
  noteId: string
  isStarred: boolean
}

export function StarButton({ noteId, isStarred }: StarButtonProps) {
  const [starred, setStarred] = useState(isStarred)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsAnimating(true)
    setStarred(!starred)
    
    try {
      await toggleStar(noteId)
    } catch {
      setStarred(starred) // 回滚
    }
    
    setTimeout(() => setIsAnimating(false), 500)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="h-8 w-8 relative"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={starred ? 'starred' : 'unstarred'}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ duration: 0.3 }}
        >
          <Star
            className={cn(
              "h-4 w-4 transition-colors",
              starred 
                ? "fill-yellow-400 text-yellow-400" 
                : "text-muted-foreground"
            )}
          />
        </motion.div>
      </AnimatePresence>
      
      {/* 点击时的粒子效果 */}
      {isAnimating && starred && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full"
              style={{ left: '50%', top: '50%' }}
              initial={{ x: 0, y: 0, scale: 1 }}
              animate={{
                x: Math.cos(i * 60 * Math.PI / 180) * 20,
                y: Math.sin(i * 60 * Math.PI / 180) * 20,
                scale: 0,
              }}
              transition={{ duration: 0.5 }}
            />
          ))}
        </motion.div>
      )}
    </Button>
  )
}`
    },
    {
      title: "星标排序逻辑",
      language: "typescript",
      description: "星标笔记优先显示的排序实现",
      code: `interface Note {
  id: string
  title: string
  isStarred: boolean
  starredAt: Date | null
  updatedAt: Date
}

type SortOption = 'updated' | 'created' | 'title' | 'manual'

export function sortNotesWithStarred(
  notes: Note[],
  sortBy: SortOption = 'updated'
): Note[] {
  // 分离星标和非星标笔记
  const starred = notes.filter(n => n.isStarred)
  const unstarred = notes.filter(n => !n.isStarred)

  // 星标笔记按 starredAt 降序
  const sortedStarred = starred.sort((a, b) => {
    const timeA = a.starredAt?.getTime() || 0
    const timeB = b.starredAt?.getTime() || 0
    return timeB - timeA
  })

  // 非星标笔记按选择的排序方式
  const sortedUnstarred = unstarred.sort((a, b) => {
    switch (sortBy) {
      case 'updated':
        return b.updatedAt.getTime() - a.updatedAt.getTime()
      case 'title':
        return a.title.localeCompare(b.title, 'zh-CN')
      default:
        return 0
    }
  })

  // 星标在前，非星标在后
  return [...sortedStarred, ...sortedUnstarred]
}

// 在笔记列表中使用
function NoteList({ notes, sortBy }: Props) {
  const sortedNotes = useMemo(
    () => sortNotesWithStarred(notes, sortBy),
    [notes, sortBy]
  )
  
  return (
    <div className="space-y-2">
      {sortedNotes.map(note => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  )
}`
    },
    {
      title: "批量星标操作",
      language: "typescript",
      description: "支持多选笔记批量添加/移除星标",
      code: `'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export async function batchToggleStar(
  noteIds: string[],
  starred: boolean
) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('未登录')
  }

  // 验证用户对这些笔记的所有权
  const notes = await prisma.note.findMany({
    where: {
      id: { in: noteIds },
      userId: session.user.id,
    },
    select: { id: true }
  })

  const validIds = notes.map(n => n.id)

  // 批量更新
  await prisma.note.updateMany({
    where: { id: { in: validIds } },
    data: {
      isStarred: starred,
      starredAt: starred ? new Date() : null,
    }
  })

  revalidatePath('/dashboard')
  
  return {
    success: true,
    updated: validIds.length,
  }
}

// 使用示例
async function handleBatchStar() {
  const selectedIds = getSelectedNoteIds()
  await batchToggleStar(selectedIds, true)
  toast.success(\`已星标 \${selectedIds.length} 篇笔记\`)
  clearSelection()
}`
    }
  ],
  keyFunctions: [
    "toggleStar()",
    "batchToggleStar()",
    "sortNotesWithStarred()",
    "prisma.note.update()",
    "AnimatePresence",
    "motion.div",
    "useMemo()"
  ]
}


// 3. 数据统计功能详情
export const dataStatisticsFeature: FeatureDetailData = {
  title: "数据统计",
  description: "笔记数量、编辑时长、活跃度统计",
  icon: BarChart3,
  color: "text-emerald-700",
  bgColor: "bg-emerald-700/10",
  technologies: [
    {
      name: "Recharts",
      description: "React 图表库，绘制统计图表",
      type: "library"
    },
    {
      name: "数据聚合查询",
      description: "Prisma 聚合函数统计笔记数据",
      type: "pattern"
    },
    {
      name: "时间序列分析",
      description: "按日/周/月统计编辑活动",
      type: "pattern"
    },
    {
      name: "缓存优化",
      description: "统计数据缓存，避免频繁计算",
      type: "pattern"
    },
    {
      name: "实时更新",
      description: "编辑时实时更新统计数据",
      type: "pattern"
    },
    {
      name: "导出报告",
      description: "支持导出统计报告为 PDF/CSV",
      type: "pattern"
    }
  ],
  coreFiles: [
    {
      path: "src/lib/actions/statistics.ts",
      description: "统计数据获取 Server Actions"
    },
    {
      path: "src/components/dashboard/statistics-cards.tsx",
      description: "统计卡片组件，显示关键指标"
    },
    {
      path: "src/components/dashboard/activity-chart.tsx",
      description: "活动图表组件，展示编辑趋势"
    },
    {
      path: "src/app/dashboard/statistics/page.tsx",
      description: "统计详情页面"
    },
    {
      path: "src/hooks/use-statistics.ts",
      description: "统计数据 Hook，处理数据获取和缓存"
    }
  ],
  workflow: [
    "用户访问仪表盘或统计页面",
    "检查缓存中是否有有效的统计数据",
    "缓存有效则直接返回，否则重新计算",
    "执行 Prisma 聚合查询获取笔记统计",
    "计算总笔记数、本周新增、总字数等",
    "查询编辑历史，生成时间序列数据",
    "计算活跃度指标（连续编辑天数等）",
    "将结果缓存并返回给前端",
    "前端使用 Recharts 渲染图表",
    "用户编辑笔记时，增量更新统计缓存"
  ],
  codeSnippets: [
    {
      title: "统计数据获取",
      language: "typescript",
      description: "聚合查询获取用户统计数据",
      code: `'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { cache } from 'react'
import { startOfWeek, startOfMonth, subDays, format } from 'date-fns'

export interface UserStatistics {
  totalNotes: number
  totalWords: number
  thisWeekNotes: number
  thisMonthNotes: number
  averageWordsPerNote: number
  longestStreak: number
  currentStreak: number
  mostActiveDay: string
  tagDistribution: { name: string; count: number }[]
  activityData: { date: string; count: number }[]
}

export const getUserStatistics = cache(async (): Promise<UserStatistics> => {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('未登录')
  }

  const userId = session.user.id
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const monthStart = startOfMonth(now)

  // 并行执行多个查询
  const [
    totalNotes,
    thisWeekNotes,
    thisMonthNotes,
    notes,
    tagStats,
    activityLogs,
  ] = await Promise.all([
    // 总笔记数
    prisma.note.count({ where: { userId } }),
    // 本周新增
    prisma.note.count({
      where: { userId, createdAt: { gte: weekStart } }
    }),
    // 本月新增
    prisma.note.count({
      where: { userId, createdAt: { gte: monthStart } }
    }),
    // 获取所有笔记计算字数
    prisma.note.findMany({
      where: { userId },
      select: { content: true }
    }),
    // 标签分布
    prisma.tag.findMany({
      where: { notes: { some: { userId } } },
      include: { _count: { select: { notes: true } } }
    }),
    // 最近30天活动
    prisma.note.findMany({
      where: {
        userId,
        updatedAt: { gte: subDays(now, 30) }
      },
      select: { updatedAt: true }
    }),
  ])

  // 计算总字数
  const totalWords = notes.reduce((sum, note) => {
    return sum + (note.content?.length || 0)
  }, 0)

  // 计算活动数据
  const activityMap = new Map<string, number>()
  activityLogs.forEach(log => {
    const date = format(log.updatedAt, 'yyyy-MM-dd')
    activityMap.set(date, (activityMap.get(date) || 0) + 1)
  })

  const activityData = Array.from(activityMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    totalNotes,
    totalWords,
    thisWeekNotes,
    thisMonthNotes,
    averageWordsPerNote: totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0,
    longestStreak: calculateStreak(activityData, 'longest'),
    currentStreak: calculateStreak(activityData, 'current'),
    mostActiveDay: findMostActiveDay(activityData),
    tagDistribution: tagStats.map(t => ({
      name: t.name,
      count: t._count.notes
    })),
    activityData,
  }
})`
    },
    {
      title: "统计卡片组件",
      language: "typescript",
      description: "展示关键统计指标",
      code: `'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Calendar, Type, Flame } from 'lucide-react'
import { motion } from 'framer-motion'
import type { UserStatistics } from '@/lib/actions/statistics'

interface StatisticsCardsProps {
  stats: UserStatistics
}

export function StatisticsCards({ stats }: StatisticsCardsProps) {
  const cards = [
    {
      title: '总笔记数',
      value: stats.totalNotes,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      suffix: '篇',
    },
    {
      title: '本周新增',
      value: stats.thisWeekNotes,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      suffix: '篇',
    },
    {
      title: '总字数',
      value: stats.totalWords.toLocaleString(),
      icon: Type,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      suffix: '字',
    },
    {
      title: '连续天数',
      value: stats.currentStreak,
      icon: Flame,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      suffix: '天',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={\`p-2 rounded-lg \${card.bgColor}\`}>
                <card.icon className={\`h-4 w-4 \${card.color}\`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {card.value}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {card.suffix}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}`
    },
    {
      title: "活动图表组件",
      language: "typescript",
      description: "使用 Recharts 绘制活动趋势图",
      code: `'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface ActivityChartProps {
  data: { date: string; count: number }[]
}

export function ActivityChart({ data }: ActivityChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    displayDate: format(parseISO(item.date), 'M/d', { locale: zhCN }),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>编辑活动趋势</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload?.length) {
                    return (
                      <div className="bg-popover border rounded-lg p-2 shadow-lg">
                        <p className="text-sm font-medium">
                          {payload[0].payload.date}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          编辑 {payload[0].value} 次
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorCount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}`
    }
  ],
  keyFunctions: [
    "getUserStatistics()",
    "prisma.note.count()",
    "prisma.note.aggregate()",
    "calculateStreak()",
    "ResponsiveContainer",
    "AreaChart",
    "cache()"
  ]
}

// 4. 提醒通知功能详情
export const remindersFeature: FeatureDetailData = {
  title: "提醒通知",
  description: "设置笔记提醒，定时通知",
  icon: Bell,
  color: "text-rose-600",
  bgColor: "bg-rose-600/10",
  technologies: [
    {
      name: "Web Notifications API",
      description: "浏览器原生通知 API",
      type: "api"
    },
    {
      name: "Service Worker",
      description: "后台推送通知，即使页面关闭也能收到",
      type: "pattern"
    },
    {
      name: "Cron 任务",
      description: "服务端定时任务检查到期提醒",
      type: "pattern"
    },
    {
      name: "日期选择器",
      description: "使用 react-day-picker 选择提醒时间",
      type: "library"
    },
    {
      name: "时区处理",
      description: "正确处理用户时区的提醒时间",
      type: "pattern"
    },
    {
      name: "重复提醒",
      description: "支持每日/每周/每月重复提醒",
      type: "pattern"
    }
  ],
  coreFiles: [
    {
      path: "src/lib/actions/reminders.ts",
      description: "提醒相关的 Server Actions"
    },
    {
      path: "src/components/notes/reminder-dialog.tsx",
      description: "设置提醒的对话框组件"
    },
    {
      path: "src/components/notifications/notification-center.tsx",
      description: "通知中心组件，显示所有通知"
    },
    {
      path: "src/hooks/use-notifications.ts",
      description: "通知权限和推送管理 Hook"
    },
    {
      path: "src/app/api/cron/reminders/route.ts",
      description: "定时任务 API，检查到期提醒"
    }
  ],
  workflow: [
    "用户在笔记详情页点击设置提醒",
    "打开提醒对话框，选择日期和时间",
    "可选择重复模式（单次/每日/每周/每月）",
    "保存提醒到数据库",
    "请求浏览器通知权限（首次）",
    "服务端 Cron 任务每分钟检查到期提醒",
    "发现到期提醒，通过 Web Push 发送通知",
    "Service Worker 接收推送，显示系统通知",
    "用户点击通知，跳转到对应笔记",
    "重复提醒自动创建下一次提醒"
  ],
  codeSnippets: [
    {
      title: "提醒对话框组件",
      language: "typescript",
      description: "设置笔记提醒的 UI",
      code: `'use client'

import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createReminder } from '@/lib/actions/reminders'
import { format, setHours, setMinutes } from 'date-fns'

interface ReminderDialogProps {
  noteId: string
  noteTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

type RepeatMode = 'none' | 'daily' | 'weekly' | 'monthly'

export function ReminderDialog({
  noteId,
  noteTitle,
  open,
  onOpenChange,
}: ReminderDialogProps) {
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState('09:00')
  const [repeat, setRepeat] = useState<RepeatMode>('none')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!date) return
    
    setIsLoading(true)
    try {
      const [hours, minutes] = time.split(':').map(Number)
      const reminderTime = setMinutes(setHours(date, hours), minutes)
      
      await createReminder({
        noteId,
        reminderAt: reminderTime,
        repeat,
      })
      
      toast.success('提醒已设置')
      onOpenChange(false)
    } catch (error) {
      toast.error('设置提醒失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>设置提醒</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground">
            为「{noteTitle}」设置提醒
          </div>
          
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={(date) => date < new Date()}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>时间</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>重复</Label>
              <Select value={repeat} onValueChange={(v) => setRepeat(v as RepeatMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不重复</SelectItem>
                  <SelectItem value="daily">每天</SelectItem>
                  <SelectItem value="weekly">每周</SelectItem>
                  <SelectItem value="monthly">每月</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!date || isLoading}>
            {isLoading ? '设置中...' : '设置提醒'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}`
    },
    {
      title: "通知权限管理",
      language: "typescript",
      description: "请求和管理浏览器通知权限",
      code: `'use client'

import { useState, useEffect, useCallback } from 'react'

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    setIsSupported('Notification' in window)
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error('您的浏览器不支持通知')
      return false
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      
      if (result === 'granted') {
        // 注册 Service Worker 推送
        await registerPushSubscription()
        return true
      } else {
        toast.error('请允许通知权限以接收提醒')
        return false
      }
    } catch (error) {
      console.error('请求通知权限失败:', error)
      return false
    }
  }, [isSupported])

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return

    new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      ...options,
    })
  }, [permission])

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
  }
}

// 注册推送订阅
async function registerPushSubscription() {
  const registration = await navigator.serviceWorker.ready
  
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  })

  // 保存订阅到服务器
  await fetch('/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
    headers: { 'Content-Type': 'application/json' },
  })
}`
    },
    {
      title: "定时任务检查提醒",
      language: "typescript",
      description: "Cron API 检查到期提醒并发送通知",
      code: `// src/app/api/cron/reminders/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import webpush from 'web-push'
import { addDays, addWeeks, addMonths } from 'date-fns'

// 配置 Web Push
webpush.setVapidDetails(
  'mailto:admin@example.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function GET(request: Request) {
  // 验证 Cron 密钥
  const authHeader = request.headers.get('authorization')
  if (authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  
  // 查找到期的提醒
  const dueReminders = await prisma.reminder.findMany({
    where: {
      reminderAt: { lte: now },
      notified: false,
    },
    include: {
      note: { select: { id: true, title: true } },
      user: {
        select: {
          pushSubscription: true,
        }
      }
    }
  })

  const results = await Promise.allSettled(
    dueReminders.map(async (reminder) => {
      // 发送推送通知
      if (reminder.user.pushSubscription) {
        await webpush.sendNotification(
          JSON.parse(reminder.user.pushSubscription),
          JSON.stringify({
            title: '笔记提醒',
            body: reminder.note.title,
            data: { noteId: reminder.note.id },
          })
        )
      }

      // 标记为已通知
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { notified: true }
      })

      // 处理重复提醒
      if (reminder.repeat !== 'none') {
        const nextTime = getNextReminderTime(reminder.reminderAt, reminder.repeat)
        await prisma.reminder.create({
          data: {
            noteId: reminder.noteId,
            userId: reminder.userId,
            reminderAt: nextTime,
            repeat: reminder.repeat,
          }
        })
      }
    })
  )

  return NextResponse.json({
    processed: dueReminders.length,
    success: results.filter(r => r.status === 'fulfilled').length,
  })
}

function getNextReminderTime(current: Date, repeat: string): Date {
  switch (repeat) {
    case 'daily': return addDays(current, 1)
    case 'weekly': return addWeeks(current, 1)
    case 'monthly': return addMonths(current, 1)
    default: return current
  }
}`
    }
  ],
  keyFunctions: [
    "Notification.requestPermission()",
    "new Notification()",
    "pushManager.subscribe()",
    "webpush.sendNotification()",
    "createReminder()",
    "setHours() / setMinutes()",
    "addDays() / addWeeks()"
  ]
}


// 5. 代码片段功能详情
export const codeSnippetsFeature: FeatureDetailData = {
  title: "代码片段",
  description: "保存和管理代码片段，快速插入",
  icon: Code,
  color: "text-indigo-700",
  bgColor: "bg-indigo-700/10",
  technologies: [
    {
      name: "Monaco Editor",
      description: "VS Code 同款编辑器，提供代码高亮和智能提示",
      type: "library"
    },
    {
      name: "Prism.js",
      description: "轻量级语法高亮库，支持 200+ 语言",
      type: "library"
    },
    {
      name: "代码片段模板",
      description: "支持变量占位符和 Tab 跳转",
      type: "pattern"
    },
    {
      name: "分类管理",
      description: "按语言和用途分类管理代码片段",
      type: "pattern"
    },
    {
      name: "快速搜索",
      description: "模糊搜索快速定位代码片段",
      type: "pattern"
    },
    {
      name: "一键复制",
      description: "点击即复制到剪贴板",
      type: "pattern"
    }
  ],
  coreFiles: [
    {
      path: "src/lib/actions/snippets.ts",
      description: "代码片段 CRUD Server Actions"
    },
    {
      path: "src/components/snippets/snippet-manager.tsx",
      description: "代码片段管理器组件"
    },
    {
      path: "src/components/snippets/snippet-editor.tsx",
      description: "代码片段编辑器，支持语法高亮"
    },
    {
      path: "src/components/editor/snippet-picker.tsx",
      description: "编辑器中的代码片段选择器"
    },
    {
      path: "src/app/dashboard/snippets/page.tsx",
      description: "代码片段管理页面"
    }
  ],
  workflow: [
    "用户在代码片段管理页面点击新建",
    "打开代码片段编辑器",
    "输入片段名称、描述、选择语言",
    "在 Monaco Editor 中编写代码",
    "可使用 ${1:placeholder} 语法定义占位符",
    "保存代码片段到数据库",
    "在笔记编辑器中，输入 / 触发命令面板",
    "选择「插入代码片段」或使用快捷键",
    "搜索并选择要插入的代码片段",
    "代码片段插入到编辑器，光标跳转到第一个占位符",
    "Tab 键在占位符之间跳转"
  ],
  codeSnippets: [
    {
      title: "代码片段数据模型",
      language: "typescript",
      description: "Prisma 模型定义",
      code: `// prisma/schema.prisma
model CodeSnippet {
  id          String   @id @default(cuid())
  name        String
  description String?
  code        String   @db.Text
  language    String   @default("javascript")
  category    String?
  tags        String[] @default([])
  
  // 使用统计
  usageCount  Int      @default(0)
  lastUsedAt  DateTime?
  
  // 关联
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([language])
  @@index([category])
}`
    },
    {
      title: "代码片段编辑器",
      language: "typescript",
      description: "使用 Monaco Editor 编辑代码片段",
      code: `'use client'

import { useState } from 'react'
import Editor from '@monaco-editor/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createSnippet, updateSnippet } from '@/lib/actions/snippets'

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'go',
  'rust', 'cpp', 'csharp', 'php', 'ruby', 'sql', 'html', 'css',
]

interface SnippetEditorProps {
  snippet?: CodeSnippet
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: () => void
}

export function SnippetEditor({
  snippet,
  open,
  onOpenChange,
  onSave,
}: SnippetEditorProps) {
  const [name, setName] = useState(snippet?.name || '')
  const [description, setDescription] = useState(snippet?.description || '')
  const [language, setLanguage] = useState(snippet?.language || 'javascript')
  const [code, setCode] = useState(snippet?.code || '')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!name || !code) {
      toast.error('请填写名称和代码')
      return
    }

    setIsLoading(true)
    try {
      if (snippet) {
        await updateSnippet(snippet.id, { name, description, language, code })
      } else {
        await createSnippet({ name, description, language, code })
      }
      toast.success(snippet ? '已更新' : '已创建')
      onSave?.()
      onOpenChange(false)
    } catch {
      toast.error('保存失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{snippet ? '编辑代码片段' : '新建代码片段'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>名称</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：React useState Hook"
            />
          </div>
          <div className="space-y-2">
            <Label>语言</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>描述（可选）</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="简短描述这个代码片段的用途"
          />
        </div>

        <div className="flex-1 min-h-0 space-y-2">
          <Label>代码</Label>
          <div className="h-full border rounded-md overflow-hidden">
            <Editor
              language={language}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                tabSize: 2,
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}`
    },
    {
      title: "代码片段选择器",
      language: "typescript",
      description: "在编辑器中快速插入代码片段",
      code: `'use client'

import { useState, useEffect, useMemo } from 'react'
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty, CommandGroup } from '@/components/ui/command'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Code, Copy, Check } from 'lucide-react'
import { getSnippets } from '@/lib/actions/snippets'
import Prism from 'prismjs'

interface SnippetPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (code: string) => void
}

export function SnippetPicker({ open, onOpenChange, onSelect }: SnippetPickerProps) {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([])
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      getSnippets().then(setSnippets)
    }
  }, [open])

  const filteredSnippets = useMemo(() => {
    if (!search) return snippets
    const lower = search.toLowerCase()
    return snippets.filter(s =>
      s.name.toLowerCase().includes(lower) ||
      s.description?.toLowerCase().includes(lower) ||
      s.language.toLowerCase().includes(lower)
    )
  }, [snippets, search])

  // 按语言分组
  const groupedSnippets = useMemo(() => {
    const groups: Record<string, CodeSnippet[]> = {}
    filteredSnippets.forEach(s => {
      if (!groups[s.language]) groups[s.language] = []
      groups[s.language].push(s)
    })
    return groups
  }, [filteredSnippets])

  const handleSelect = (snippet: CodeSnippet) => {
    onSelect(snippet.code)
    onOpenChange(false)
    // 更新使用统计
    incrementUsageCount(snippet.id)
  }

  const handleCopy = async (snippet: CodeSnippet, e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(snippet.code)
    setCopiedId(snippet.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <Command className="rounded-lg border-0">
          <CommandInput
            placeholder="搜索代码片段..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[400px]">
            <CommandEmpty>未找到代码片段</CommandEmpty>
            
            {Object.entries(groupedSnippets).map(([language, items]) => (
              <CommandGroup key={language} heading={language.toUpperCase()}>
                {items.map(snippet => (
                  <CommandItem
                    key={snippet.id}
                    onSelect={() => handleSelect(snippet)}
                    className="flex items-start gap-3 p-3"
                  >
                    <Code className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{snippet.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {snippet.language}
                        </Badge>
                      </div>
                      {snippet.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {snippet.description}
                        </p>
                      )}
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-hidden max-h-20">
                        <code
                          dangerouslySetInnerHTML={{
                            __html: Prism.highlight(
                              snippet.code.slice(0, 200),
                              Prism.languages[snippet.language] || Prism.languages.plaintext,
                              snippet.language
                            )
                          }}
                        />
                      </pre>
                    </div>
                    <button
                      onClick={(e) => handleCopy(snippet, e)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      {copiedId === snippet.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}`
    },
    {
      title: "代码片段 Server Actions",
      language: "typescript",
      description: "CRUD 操作实现",
      code: `'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export async function getSnippets(options?: {
  language?: string
  category?: string
  search?: string
}) {
  const session = await auth()
  if (!session?.user?.id) return []

  const where: any = { userId: session.user.id }
  
  if (options?.language) {
    where.language = options.language
  }
  if (options?.category) {
    where.category = options.category
  }
  if (options?.search) {
    where.OR = [
      { name: { contains: options.search, mode: 'insensitive' } },
      { description: { contains: options.search, mode: 'insensitive' } },
    ]
  }

  return prisma.codeSnippet.findMany({
    where,
    orderBy: [
      { usageCount: 'desc' },
      { updatedAt: 'desc' },
    ],
  })
}

export async function createSnippet(data: {
  name: string
  description?: string
  language: string
  code: string
  category?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('未登录')

  const snippet = await prisma.codeSnippet.create({
    data: {
      ...data,
      userId: session.user.id,
    },
  })

  revalidatePath('/dashboard/snippets')
  return snippet
}

export async function updateSnippet(id: string, data: Partial<{
  name: string
  description: string
  language: string
  code: string
  category: string
}>) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('未登录')

  const snippet = await prisma.codeSnippet.update({
    where: { id, userId: session.user.id },
    data,
  })

  revalidatePath('/dashboard/snippets')
  return snippet
}

export async function deleteSnippet(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('未登录')

  await prisma.codeSnippet.delete({
    where: { id, userId: session.user.id },
  })

  revalidatePath('/dashboard/snippets')
}

export async function incrementUsageCount(id: string) {
  await prisma.codeSnippet.update({
    where: { id },
    data: {
      usageCount: { increment: 1 },
      lastUsedAt: new Date(),
    },
  })
}`
    }
  ],
  keyFunctions: [
    "getSnippets()",
    "createSnippet()",
    "updateSnippet()",
    "deleteSnippet()",
    "Prism.highlight()",
    "Monaco Editor",
    "incrementUsageCount()"
  ]
}

// 导出第二组特色功能数据映射
export const specialFeatureDetails2: Record<string, FeatureDetailData> = {
  "favorites": favoritesFeature,
  "starred-notes": starredNotesFeature,
  "data-statistics": dataStatisticsFeature,
  "reminders": remindersFeature,
  "code-snippets": codeSnippetsFeature,
}
