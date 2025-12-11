"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FeatureDetailDialog } from "./feature-detail-dialog"
import { specialFeatureDetails } from "./special-feature-data"
import { WifiOff, Keyboard, Moon, Database, Shield, Info, Wand2 } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * 特色功能卡片组件（前5个带详情弹窗）
 * 点击可弹出功能实现详情
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

const specialFeatures: SpecialFeature[] = [
  {
    id: "offline-sync",
    icon: WifiOff,
    title: "离线同步",
    description: "离线编辑笔记，联网后自动同步到云端",
    color: "text-blue-700",
    bgColor: "bg-blue-700/10",
    status: "new",
    info: "支持离线编辑和自动冲突解决"
  },
  {
    id: "keyboard-shortcuts",
    icon: Keyboard,
    title: "快捷键支持",
    description: "丰富的键盘快捷键，提升编辑效率",
    color: "text-purple-700",
    bgColor: "bg-purple-700/10",
    status: "stable",
    info: "Ctrl+S 保存、Ctrl+K 搜索等"
  },
  {
    id: "dark-mode",
    icon: Moon,
    title: "深色模式",
    description: "自动切换深色/浅色主题，保护眼睛",
    color: "text-slate-700",
    bgColor: "bg-slate-700/10",
    status: "stable",
    info: "支持系统主题自动切换"
  },
  {
    id: "local-storage",
    icon: Database,
    title: "本地存储",
    description: "数据本地缓存，快速加载和离线访问",
    color: "text-cyan-700",
    bgColor: "bg-cyan-700/10",
    status: "stable"
  },
  {
    id: "data-encryption",
    icon: Shield,
    title: "数据加密",
    description: "端到端加密，保护你的隐私数据",
    color: "text-red-700",
    bgColor: "bg-red-700/10",
    status: "beta",
    info: "支持笔记内容加密"
  },
  {
    id: "ai-writing-assistant",
    icon: Wand2,
    title: "AI 写作助手",
    description: "智能改写文档，支持多种风格预设",
    color: "text-violet-700",
    bgColor: "bg-violet-700/10",
    status: "new",
    info: "学术化、幽默、精简、丰富等风格"
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

export function SpecialFeatureCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {specialFeatures.map((feature) => {
        const Icon = feature.icon
        const featureDetail = specialFeatureDetails[feature.id]

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
