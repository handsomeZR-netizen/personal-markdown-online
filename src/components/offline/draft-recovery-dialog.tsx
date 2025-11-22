"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DraftContent } from "@/types/offline"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"
import { FileText, Clock } from "lucide-react"

interface DraftRecoveryDialogProps {
  draft: DraftContent | null
  open: boolean
  onRecover: () => void
  onDiscard: () => void
}

/**
 * 草稿恢复对话框组件
 * 当检测到草稿存在时显示，提供恢复或放弃选项
 */
export function DraftRecoveryDialog({
  draft,
  open,
  onRecover,
  onDiscard,
}: DraftRecoveryDialogProps) {
  if (!draft) return null

  const savedTimeAgo = formatDistanceToNow(new Date(draft.savedAt), {
    addSuffix: true,
    locale: zhCN,
  })

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            发现未保存的草稿
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              我们发现了一个未保存的草稿，是否要恢复？
            </p>
            
            <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>保存于 {savedTimeAgo}</span>
              </div>
              
              {draft.title && (
                <div className="text-sm">
                  <span className="font-medium">标题：</span>
                  <span className="text-muted-foreground">{draft.title}</span>
                </div>
              )}
              
              {draft.content && (
                <div className="text-sm">
                  <span className="font-medium">内容预览：</span>
                  <p className="text-muted-foreground line-clamp-3 mt-1">
                    {draft.content}
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard}>
            放弃草稿
          </AlertDialogCancel>
          <AlertDialogAction onClick={onRecover}>
            恢复草稿
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
