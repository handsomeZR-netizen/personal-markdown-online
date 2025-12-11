"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ImageIcon } from "lucide-react"
import { FeatureDetailDialog } from "./feature-detail-dialog"
import { wallpaperFeature } from "./wallpaper-feature-data"

export function WallpaperFeatureCard() {
  return (
    <FeatureDetailDialog feature={wallpaperFeature}>
      <Card className="h-full hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/50 group">
        <CardHeader>
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-lg bg-pink-600/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ImageIcon className="h-6 w-6 text-pink-600 group-hover:animate-pulse" />
            </div>
            <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-500/30">
              新功能
            </Badge>
          </div>
          <CardTitle className="group-hover:text-primary transition-colors">
            壁纸设置
          </CardTitle>
          <CardDescription className="group-hover:text-foreground/80 transition-colors">
            自定义应用背景壁纸、透明度和位置
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic group-hover:text-foreground/70 transition-colors">
            💡 在设置页面配置个性化壁纸
          </p>
        </CardContent>
      </Card>
    </FeatureDetailDialog>
  )
}
