import { Gauge } from "lucide-react"
import type { FeatureDetailData } from "./feature-detail-dialog"

/**
 * 性能优化功能详细数据配置
 */

export const performanceOptimizationFeature: FeatureDetailData = {
  title: "前端性能优化",
  description: "虚拟滚动、轻量组件、数据库分页，大幅降低 DOM 节点和内存占用",
  icon: Gauge,
  color: "text-emerald-600",
  bgColor: "bg-emerald-600/10",
  technologies: [
    {
      name: "react-window",
      description: "高性能虚拟滚动库，只渲染可见区域的列表项",
      type: "library"
    },
    {
      name: "react-virtualized-auto-sizer",
      description: "自动计算容器尺寸，配合虚拟滚动使用",
      type: "library"
    },
    {
      name: "React.memo",
      description: "组件记忆化，避免不必要的重渲染",
      type: "pattern"
    },
    {
      name: "Prisma 分页",
      description: "数据库级分页（skip/take），避免加载全部数据",
      type: "pattern"
    },
    {
      name: "Promise.all 并行查询",
      description: "并行执行多个数据库查询，减少总响应时间",
      type: "pattern"
    },
    {
      name: "字段选择优化",
      description: "只 select 需要的字段，减少数据传输量",
      type: "pattern"
    }
  ],
  coreFiles: [
    {
      path: "src/components/notes/optimized-note-card.tsx",
      description: "轻量级笔记卡片，移除 framer-motion 和 TooltipProvider"
    },
    {
      path: "src/components/notes/virtualized-note-grid.tsx",
      description: "虚拟滚动网格，使用 react-window 只渲染可见区域"
    },
    {
      path: "src/components/notes/notes-list-client.tsx",
      description: "智能渲染策略选择器（<50 直接渲染，>=50 虚拟滚动）"
    },
    {
      path: "src/lib/actions/notes.ts",
      description: "getNotes 改为数据库级分页，使用 Promise.all 并行查询"
    },
    {
      path: "docs/PERFORMANCE_OPTIMIZATION.md",
      description: "性能优化文档，记录问题分析和解决方案"
    }
  ],
  workflow: [
    "Chrome DevTools 检测到 DOM 节点从 779 飙升到 32,275",
    "内存从 6.8MB 增长到 39.1MB，事件监听器从 431 增到 2,185",
    "分析发现：每个笔记卡片包含大量 DOM 节点和事件监听器",
    "创建 OptimizedNoteCard：移除 framer-motion 动画，用原生 title 替代 Tooltip",
    "实现 VirtualizedNoteGrid：使用 react-window 虚拟滚动",
    "创建 NotesListClient：根据数据量智能选择渲染策略",
    "后端优化：getNotes 改为 Prisma skip/take 分页",
    "使用 Promise.all 并行执行笔记查询和总数统计",
    "只 select 列表展示需要的字段，减少数据传输",
    "预期效果：DOM 节点降至 ~100-200，内存降至 ~10MB"
  ],
  codeSnippets: [
    {
      title: "轻量级笔记卡片",
      language: "typescript",
      description: "移除动画和复杂组件，使用原生属性",
      code: `import { memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

interface OptimizedNoteCardProps {
  note: {
    id: string
    title: string
    content: string | null
    updatedAt: Date
    tags: { id: string; name: string }[]
    isPinned: boolean
    isPublic: boolean
  }
  onClick?: () => void
}

// 使用 React.memo 避免不必要的重渲染
export const OptimizedNoteCard = memo(function OptimizedNoteCard({
  note,
  onClick,
}: OptimizedNoteCardProps) {
  const preview = note.content?.slice(0, 100) || "无内容"
  
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
      // 使用原生 title 替代 Tooltip，减少 DOM 节点
      title={note.title}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base line-clamp-1">
          {note.isPinned && "📌 "}
          {note.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {preview}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1 flex-wrap">
            {note.tags.slice(0, 3).map((tag) => (
              <Badge key={tag.id} variant="secondary" className="text-xs">
                {tag.name}
              </Badge>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(note.updatedAt, { locale: zhCN, addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
})`
    },
    {
      title: "虚拟滚动网格",
      language: "typescript",
      description: "使用 react-window 只渲染可见区域",
      code: `"use client"

import { FixedSizeGrid as Grid } from "react-window"
import AutoSizer from "react-virtualized-auto-sizer"
import { OptimizedNoteCard } from "./optimized-note-card"

interface VirtualizedNoteGridProps {
  notes: NoteData[]
  onNoteClick: (id: string) => void
  columnCount?: number
}

export function VirtualizedNoteGrid({
  notes,
  onNoteClick,
  columnCount = 3,
}: VirtualizedNoteGridProps) {
  const rowCount = Math.ceil(notes.length / columnCount)
  const columnWidth = 320
  const rowHeight = 180

  const Cell = ({ columnIndex, rowIndex, style }: CellProps) => {
    const index = rowIndex * columnCount + columnIndex
    if (index >= notes.length) return null

    const note = notes[index]
    return (
      <div style={{ ...style, padding: 8 }}>
        <OptimizedNoteCard
          note={note}
          onClick={() => onNoteClick(note.id)}
        />
      </div>
    )
  }

  return (
    <AutoSizer>
      {({ height, width }) => (
        <Grid
          columnCount={columnCount}
          columnWidth={columnWidth}
          height={height}
          rowCount={rowCount}
          rowHeight={rowHeight}
          width={width}
          overscanRowCount={2} // 预渲染 2 行
        >
          {Cell}
        </Grid>
      )}
    </AutoSizer>
  )
}`
    },
    {
      title: "智能渲染策略",
      language: "typescript",
      description: "根据数据量自动选择最优渲染方式",
      code: `"use client"

import { OptimizedNoteCard } from "./optimized-note-card"
import { VirtualizedNoteGrid } from "./virtualized-note-grid"

const VIRTUALIZATION_THRESHOLD = 50

interface NotesListClientProps {
  notes: NoteData[]
  onNoteClick: (id: string) => void
}

export function NotesListClient({ notes, onNoteClick }: NotesListClientProps) {
  // 小数据量：直接渲染，避免虚拟滚动开销
  if (notes.length < VIRTUALIZATION_THRESHOLD) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.map((note) => (
          <OptimizedNoteCard
            key={note.id}
            note={note}
            onClick={() => onNoteClick(note.id)}
          />
        ))}
      </div>
    )
  }

  // 大数据量：使用虚拟滚动
  return (
    <div className="h-[calc(100vh-200px)]">
      <VirtualizedNoteGrid
        notes={notes}
        onNoteClick={onNoteClick}
      />
    </div>
  )
}`
    },
    {
      title: "数据库级分页查询",
      language: "typescript",
      description: "使用 Prisma skip/take 和 Promise.all 优化",
      code: `export async function getNotes(options: GetNotesOptions = {}) {
  const { page = 1, pageSize = 20, folderId, search } = options
  
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("未授权")
  }

  const where: Prisma.NoteWhereInput = {
    userId: session.user.id,
    ...(folderId && { folderId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ],
    }),
  }

  // 并行执行查询和计数
  const [notes, total] = await Promise.all([
    prisma.note.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      // 只选择需要的字段
      select: {
        id: true,
        title: true,
        content: true,
        updatedAt: true,
        isPinned: true,
        isPublic: true,
        tags: { select: { id: true, name: true } },
      },
      orderBy: [
        { isPinned: "desc" },
        { updatedAt: "desc" },
      ],
    }),
    prisma.note.count({ where }),
  ])

  return {
    notes,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}`
    }
  ],
  keyFunctions: [
    "React.memo()",
    "FixedSizeGrid",
    "AutoSizer",
    "Promise.all()",
    "prisma.note.findMany({ skip, take })",
    "prisma.note.count()"
  ]
}

// 导出性能优化功能数据映射
export const performanceFeatureDetails: Record<string, FeatureDetailData> = {
  "performance-optimization": performanceOptimizationFeature,
}
