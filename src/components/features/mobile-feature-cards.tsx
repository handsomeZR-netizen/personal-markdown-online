"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FeatureDetailDialog } from "./feature-detail-dialog"
import { mobileFeatureDetails } from "./mobile-feature-data"
import { wallpaperFeature } from "./wallpaper-feature-data"
import { Smartphone, Zap, Globe, ImageIcon, Info } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * 移动端与体验功能卡片组件
 * PWA 应用、加载动画、响应式设计、壁纸设置
 */

interface MobileFeature {
  id: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  color: string
  bgColor: string
  status: "stable" | "beta" | "new"
  info?: string
}

const mobileFeatures: MobileFeature[] = [
  {
    id: "pwa",
    icon: Smartphone,
    title: "PWA 应用",
    description: "安装为原生应用，支持离线使用",
    color: "text-pink-600",
    bgColor: "bg-pink-600/10",
    status: "stable",
  },
  {
    id: "loading-animation",
    icon: Zap,
    title: "加载动画",
    description: "优雅的加载动画系统，提升用户体验",
    color: "text-amber-600",
    bgColor: "bg-amber-600/10",
    status: "new",
    info: "Orbit、Pulse、Dots 等多种样式"
  },
  {
    id: "responsive-design",
    icon: Globe,
    title: "响应式设计",
    description: "完美适配桌面、平板、手机各种设备",
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
    status: "stable",
  },
  {
    id: "wallpaper",
    icon: ImageIcon,
    title: "壁纸设置",
    description: "自定义应用背景壁纸、透明度和位置",
    color: "text-pink-600",
    bgColor: "bg-pink-600/10",
    status: "new",
    info: "在设置页面配置个性化壁纸"
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

export function MobileFeatureCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {mobileFeatures.map((feature) => {
        const Icon = feature.icon
        // 壁纸功能使用单独的数据
        const featureDetail = feature.id === "wallpaper" 
          ? wallpaperFeature 
          : mobileFeatureDetails[feature.id]

        return (
          <FeatureDetailDialog key={feature.id} feature={featureDetail}>
            <Card className="h-full hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/50 group">
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform", feature.bgColor)}>
                    <Icon className={cn("h-6 w-6 group-hover:animate-pulse", feature.color)} />
                  </div>
                  {getStatusBadge(feature.status)}
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
                <CardContent className="pt-0">
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
