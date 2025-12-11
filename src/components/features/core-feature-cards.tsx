"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FeatureDetailDialog } from "./feature-detail-dialog"
import { coreFeatureDetails } from "./feature-data"
import { Edit3, FolderTree, Search, Tag, Info } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * 核心功能卡片组件
 * 点击可弹出功能实现详情
 */

interface CoreFeature {
  id: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  color: string
  bgColor: string
  status: "stable" | "beta" | "new"
  info?: string
}

const coreFeatures: CoreFeature[] = [
  {
    id: "markdown-editor",
    icon: Edit3,
    title: "Markdown 编辑器",
    description: "强大的 Markdown 编辑器，支持实时预览和语法高亮",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    status: "stable"
  },
  {
    id: "folder-management",
    icon: FolderTree,
    title: "文件夹管理",
    description: "创建、嵌套、拖放文件夹，树形结构组织笔记",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    status: "stable",
    info: "在笔记列表左侧查看文件夹树"
  },
  {
    id: "full-text-search",
    icon: Search,
    title: "全文搜索",
    description: "统一搜索文件夹和笔记内容，支持全文检索",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    status: "stable"
  },
  {
    id: "tag-system",
    icon: Tag,
    title: "标签系统",
    description: "为笔记添加标签，快速分类和查找",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    status: "stable"
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

export function CoreFeatureCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {coreFeatures.map((feature) => {
        const Icon = feature.icon
        const featureDetail = coreFeatureDetails[feature.id]

        if (!featureDetail) {
          // 如果没有详情数据，显示普通卡片
          return (
            <Card key={feature.id} className="h-full hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/50 group">
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform", feature.bgColor)}>
                    <Icon className={cn("h-6 w-6 group-hover:animate-pulse", feature.color)} />
                  </div>
                  {getStatusBadge(feature.status)}
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">
                  {feature.title}
                </CardTitle>
                <CardDescription className="group-hover:text-foreground/80 transition-colors">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              {feature.info && (
                <CardContent>
                  <p className="text-sm text-muted-foreground italic group-hover:text-foreground/70 transition-colors">
                    💡 {feature.info}
                  </p>
                </CardContent>
              )}
            </Card>
          )
        }

        // 有详情数据，包装成可点击弹窗
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
                <CardTitle className="group-hover:text-primary transition-colors flex items-center gap-2">
                  {feature.title}
                  <Info className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardTitle>
                <CardDescription className="group-hover:text-foreground/80 transition-colors">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              {feature.info && (
                <CardContent>
                  <p className="text-sm text-muted-foreground italic group-hover:text-foreground/70 transition-colors">
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
