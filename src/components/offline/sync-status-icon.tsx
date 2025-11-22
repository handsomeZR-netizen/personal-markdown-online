"use client"

import { Check, Cloud, AlertCircle, Loader2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { SyncStatus } from "@/types/offline"

interface SyncStatusIconProps {
  status: SyncStatus
  className?: string
  onClick?: () => void
  showTooltip?: boolean
}

const statusConfig = {
  synced: {
    icon: Check,
    color: "text-green-600",
    label: "已同步",
    description: "笔记已成功同步到服务器",
    animate: false
  },
  pending: {
    icon: Cloud,
    color: "text-gray-400",
    label: "待同步",
    description: "笔记等待同步到服务器",
    animate: false
  },
  syncing: {
    icon: Loader2,
    color: "text-blue-600",
    label: "同步中",
    description: "正在同步到服务器",
    animate: true
  },
  failed: {
    icon: AlertCircle,
    color: "text-red-600",
    label: "同步失败",
    description: "同步失败，点击查看详情",
    animate: false
  }
} as const

export function SyncStatusIcon({ 
  status, 
  className, 
  onClick,
  showTooltip = true 
}: SyncStatusIconProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  const iconElement = (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-full p-1 transition-colors hover:bg-accent",
        onClick && "cursor-pointer",
        !onClick && "cursor-default",
        className
      )}
      aria-label={config.label}
      type="button"
    >
      <Icon 
        className={cn(
          "h-4 w-4",
          config.color,
          config.animate && "animate-spin"
        )}
        aria-hidden="true"
      />
    </button>
  )

  if (!showTooltip) {
    return iconElement
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {iconElement}
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{config.label}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
