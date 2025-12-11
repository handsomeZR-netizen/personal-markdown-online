"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FeatureDetailDialog } from "./feature-detail-dialog"
import { contentFeatureDetails } from "./feature-data"
import { Calculator, Image, Palette, Eye, Info } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * 内容增强功能卡片组件
 * 点击可弹出功能实现详情
 */

interface ContentFeature {
  id: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  color: string
  bgColor: string
  status: "stable" | "beta" | "new"
  info?: string
}

const contentFeatures: ContentFeature[] = [
  {
    id: "math-formula",
    icon: Calculator,
    title: "数学公式",
    description: "完整的 LaTeX 数学公式渲染，支持行内和块级公式",
    color: "text-blue-600",
    bgColor: "bg-blue-600/10",
    status: "new",
    info: "使用 $公式$ 或 $$公式$$ 语法"
  },
  {
    id: "image-upload",
    icon: Image,
    title: "图片上传",
    description: "拖拽、粘贴上传图片，支持进度显示和批量上传",
    color: "text-purple-600",
    bgColor: "bg-purple-600/10",
    status: "new",
    info: "直接拖拽或 Ctrl+V 粘贴图片"
  },
  {
    id: "syntax-highlight",
    icon: Palette,
    title: "语法高亮",
    description: "代码块语法高亮，支持多种编程语言",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    status: "stable"
  },
  {
    id: "live-preview",
    icon: Eye,
    title: "实时预览",
    description: "Markdown 实时预览，所见即所得",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
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

export function ContentFeatureCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {contentFeatures.map((feature) => {
        const Icon = feature.icon
        const featureDetail = contentFeatureDetails[feature.id]

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
