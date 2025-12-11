"use client"

import { Users, Share2, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { FeatureDetailDialog } from "./feature-detail-dialog"
import {
  realtimeCollaborationFeature,
  publicSharingFeature,
  permissionManagementFeature,
} from "./collaboration-feature-data"

interface CollaborationFeatureCardProps {
  className?: string
}

/**
 * 实时协作功能卡片
 */
export function RealtimeCollaborationCard({ className }: CollaborationFeatureCardProps) {
  return (
    <FeatureDetailDialog feature={realtimeCollaborationFeature}>
      <Card className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-green-500/50",
        className
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
              <Users className="h-6 w-6 text-green-500" />
            </div>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
              测试版
            </Badge>
          </div>
          <CardTitle className="text-lg mt-3">实时协作</CardTitle>
          <CardDescription>
            多人同时编辑笔记，实时同步光标和内容
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
            需要启动 WebSocket 服务器
          </p>
        </CardContent>
      </Card>
    </FeatureDetailDialog>
  )
}

/**
 * 公开分享功能卡片
 */
export function PublicSharingCard({ className }: CollaborationFeatureCardProps) {
  return (
    <FeatureDetailDialog feature={publicSharingFeature}>
      <Card className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-blue-500/50",
        className
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <Share2 className="h-6 w-6 text-blue-500" />
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
              稳定
            </Badge>
          </div>
          <CardTitle className="text-lg mt-3">公开分享</CardTitle>
          <CardDescription>
            生成公开链接，与任何人分享你的笔记
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
            在笔记页面点击分享按钮
          </p>
        </CardContent>
      </Card>
    </FeatureDetailDialog>
  )
}

/**
 * 权限管理功能卡片
 */
export function PermissionManagementCard({ className }: CollaborationFeatureCardProps) {
  return (
    <FeatureDetailDialog feature={permissionManagementFeature}>
      <Card className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-red-500/50",
        className
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
              <Shield className="h-6 w-6 text-red-500" />
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
              稳定
            </Badge>
          </div>
          <CardTitle className="text-lg mt-3">权限管理</CardTitle>
          <CardDescription>
            设置笔记访问权限，控制谁可以查看和编辑
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
            在笔记页面管理协作者
          </p>
        </CardContent>
      </Card>
    </FeatureDetailDialog>
  )
}

/**
 * 协作功能卡片组 - 用于功能展示页面
 */
export function CollaborationFeatureCards({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
      <RealtimeCollaborationCard />
      <PublicSharingCard />
      <PermissionManagementCard />
    </div>
  )
}
