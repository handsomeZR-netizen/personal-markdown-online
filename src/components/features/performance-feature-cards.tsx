"use client"

import { Gauge, TrendingDown, Cpu, HardDrive } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { FeatureDetailDialog } from "./feature-detail-dialog"
import { performanceOptimizationFeature } from "./performance-feature-data"

interface PerformanceFeatureCardProps {
  className?: string
}

/**
 * 性能优化功能卡片
 */
export function PerformanceOptimizationCard({ className }: PerformanceFeatureCardProps) {
  return (
    <FeatureDetailDialog feature={performanceOptimizationFeature}>
      <Card className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-emerald-500/50",
        className
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-lg bg-emerald-600/10 flex items-center justify-center group-hover:bg-emerald-600/20 transition-colors">
              <Gauge className="h-6 w-6 text-emerald-600" />
            </div>
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
              新功能
            </Badge>
          </div>
          <CardTitle className="text-lg mt-3">前端性能优化</CardTitle>
          <CardDescription>
            虚拟滚动、轻量组件、数据库分页，大幅降低资源占用
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex flex-col items-center p-2 bg-muted/50 rounded-lg">
              <TrendingDown className="h-4 w-4 text-emerald-500 mb-1" />
              <span className="font-semibold text-emerald-600">DOM</span>
              <span className="text-muted-foreground">32K → 200</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-muted/50 rounded-lg">
              <HardDrive className="h-4 w-4 text-blue-500 mb-1" />
              <span className="font-semibold text-blue-600">内存</span>
              <span className="text-muted-foreground">39MB → 10MB</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-muted/50 rounded-lg">
              <Cpu className="h-4 w-4 text-purple-500 mb-1" />
              <span className="font-semibold text-purple-600">监听器</span>
              <span className="text-muted-foreground">2K → 100</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </FeatureDetailDialog>
  )
}

/**
 * 性能优化卡片组 - 用于功能展示页面
 */
export function PerformanceFeatureCards({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
      <PerformanceOptimizationCard />
    </div>
  )
}
