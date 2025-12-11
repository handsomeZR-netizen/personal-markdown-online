"use client"

import { FileText, Sparkles, Webhook } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { FeatureDetailDialog } from "./feature-detail-dialog"
import {
  templateSystemFeature,
  aiAssistantFeature,
  webhookIntegrationFeature,
} from "./productivity-feature-data"

interface ProductivityFeatureCardProps {
  className?: string
}

/**
 * 模板系统功能卡片
 */
export function TemplateSystemCard({ className }: ProductivityFeatureCardProps) {
  return (
    <FeatureDetailDialog feature={templateSystemFeature}>
      <Card className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-indigo-500/50",
        className
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-lg bg-indigo-600/10 flex items-center justify-center group-hover:bg-indigo-600/20 transition-colors">
              <FileText className="h-6 w-6 text-indigo-600" />
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
              稳定
            </Badge>
          </div>
          <CardTitle className="text-lg mt-3">模板系统</CardTitle>
          <CardDescription>
            使用和创建笔记模板，提高工作效率
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
            支持自定义模板和变量替换
          </p>
        </CardContent>
      </Card>
    </FeatureDetailDialog>
  )
}

/**
 * AI 助手功能卡片
 */
export function AIAssistantCard({ className }: ProductivityFeatureCardProps) {
  return (
    <FeatureDetailDialog feature={aiAssistantFeature}>
      <Card className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-violet-500/50",
        className
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-lg bg-violet-600/10 flex items-center justify-center group-hover:bg-violet-600/20 transition-colors">
              <Sparkles className="h-6 w-6 text-violet-600" />
            </div>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
              测试版
            </Badge>
          </div>
          <CardTitle className="text-lg mt-3">AI 助手</CardTitle>
          <CardDescription>
            AI 摘要、标签生成、内容格式化、语义搜索
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
            需要配置 OpenAI API Key
          </p>
        </CardContent>
      </Card>
    </FeatureDetailDialog>
  )
}

/**
 * Webhook 集成功能卡片
 */
export function WebhookIntegrationCard({ className }: ProductivityFeatureCardProps) {
  return (
    <FeatureDetailDialog feature={webhookIntegrationFeature}>
      <Card className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-red-500/50",
        className
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-lg bg-red-600/10 flex items-center justify-center group-hover:bg-red-600/20 transition-colors">
              <Webhook className="h-6 w-6 text-red-600" />
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
              稳定
            </Badge>
          </div>
          <CardTitle className="text-lg mt-3">Webhook 集成</CardTitle>
          <CardDescription>
            笔记事件通知和自动化集成
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
            在设置页面配置 Webhook
          </p>
        </CardContent>
      </Card>
    </FeatureDetailDialog>
  )
}

/**
 * 效率工具卡片组 - 用于功能展示页面
 */
export function ProductivityFeatureCards({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
      <TemplateSystemCard />
      <AIAssistantCard />
      <WebhookIntegrationCard />
    </div>
  )
}
