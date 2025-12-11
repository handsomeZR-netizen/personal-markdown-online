"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FeatureDetailDialog } from "./feature-detail-dialog"
import { specialFeatureDetails2 } from "./special-feature-data-2"
import { Bookmark, Star, BarChart3, Bell, Code, Info } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * 特色功能卡片组件（第二组）
 * 收藏夹、星标笔记、数据统计、提醒通知、代码片段
 */

interface SpecialFeature {
  id: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  color: string
  bgColor: string
  status: "stable" | "beta" | "new"
  info?: string
}

const specialFeatures2: SpecialFeature[] = [
  {
    id: "favorites",
    icon: Bookmark,
    title: "收藏夹",
    description: "收藏重要笔记，快速访问常用内容",
    color: "text-amber-700",
    bgColor: "bg-amber-700/10",
    status: "stable",
    info: "Ctrl+D 快速收藏"
  },
  {
    id: "starred-notes",
    icon: Star,
    title: "星标笔记",
    description: "标记重要笔记，置顶显示",
    color: "text-yellow-600",
    bgColor: "bg-yellow-600/10",
    status: "stable",
    info: "星标笔记优先显示"
  },
  {
    id: "data-statistics",
    icon: BarChart3,
    title: "数据统计",
    description: "笔记数量、编辑时长、活跃度统计",
    color: "text-emerald-700",
    bgColor: "bg-emerald-700/10",
    status: "stable",
    info: "可视化图表展示"
  },
  {
    id: "reminders",
    icon: Bell,
    title: "提醒通知",
    description: "设置笔记提醒，定时通知",
    color: "text-rose-600",
    bgColor: "bg-rose-600/10",
    status: "beta",
    info: "支持重复提醒"
  },
  {
    id: "code-snippets",
    icon: Code,
    title: "代码片段",
    description: "保存和管理代码片段，快速插入",
    color: "text-indigo-700",
    bgColor: "bg-indigo-700/10",
    status: "stable",
    info: "支持 200+ 语言高亮"
  }
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case "new":
      return <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-500/30">新功能</Badge>
    case "beta":
      return <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 hover:bg-blue-500/30">测试版</Badge>
    case "stable":
      return <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 hover:bg-green-500/30">稳定</Badge>
    default:
      return null
  }
}

export function SpecialFeatureCards2() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {specialFeatures2.map((feature) => {
        const Icon = feature.icon
        const featureDetail = specialFeatureDetails2[feature.id]

        if (!featureDetail) {
          return (
            <Card key={feature.id} className="h-full hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/50 group">
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform", feature.bgColor)}>
                    <Icon className={cn("h-6 w-6 group-hover:animate-pulse", feature.color)} />
                  </div>
                  {getStatusBadge(feature.status)}
                </div>
                <CardTitle className="group-hover:text-primary transition-colors text-base">
                  {feature.title}
                </CardTitle>
                <CardDescription className="group-hover:text-foreground/80 transition-colors text-sm">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              {feature.info && (
                <CardContent>
                  <p className="text-xs text-muted-foreground italic group-hover:text-foreground/70 transition-colors">
                    💡 {feature.info}
                  </p>
                </CardContent>
              )}
            </Card>
          )
        }

        return (
          <FeatureDetailDialog key={feature.id} feature={featureDetail}>
            <Card className="h-full hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/50 group">
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform", feature.bgColor)}>
                    <Icon className={cn("h-6 w-6 group-hover:animate-pulse", feature.color)} />
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(feature.status)}
                  </div>
                </div>
                <CardTitle className="group-hover:text-primary transition-colors flex items-center gap-2 text-base">
                  {feature.title}
                  <Info className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardTitle>
                <CardDescription className="group-hover:text-foreground/80 transition-colors text-sm">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              {feature.info && (
                <CardContent>
                  <p className="text-xs text-muted-foreground italic group-hover:text-foreground/70 transition-colors">
                    💡 {feature.info}
                  </p>
                </CardContent>
              )}
              <CardContent className="pt-0">
                <p className="text-xs text-primary/70 group-hover:text-primary transition-colors">
                  点击查看实现详情 →
                </p>
              </CardContent>
            </Card>
          </FeatureDetailDialog>
        )
      })}
    </div>
  )
}
