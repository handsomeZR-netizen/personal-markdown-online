"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, History, Users, Share2 } from "lucide-react"
import dynamic from "next/dynamic"

// 动态导入对话框组件
const ExportDialog = dynamic(() => import('@/components/export/export-dialog').then(mod => ({ default: mod.ExportDialog })), {
  ssr: false
})

const VersionHistory = dynamic(() => import('@/components/collaboration/version-history').then(mod => ({ default: mod.VersionHistory })), {
  ssr: false
})

const ShareDialog = dynamic(() => import('@/components/collaboration/share-dialog').then(mod => ({ default: mod.ShareDialog })), {
  ssr: false,
  loading: () => <div className="text-sm text-muted-foreground">加载中...</div>
})

interface NoteActionsToolbarProps {
  noteId: string
  noteTitle: string
  noteContent: string
}

export function NoteActionsToolbar({ noteId, noteTitle, noteContent }: NoteActionsToolbarProps) {
  const [showExport, setShowExport] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showShare, setShowShare] = useState(false)

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowExport(true)}
          title="导出笔记"
        >
          <Download className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">导出</span>
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowHistory(true)}
          title="查看版本历史"
        >
          <History className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">历史</span>
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowShare(true)}
          title="分享笔记"
        >
          <Share2 className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">分享</span>
        </Button>
      </div>

      {/* 导出对话框 */}
      {showExport && (
        <ExportDialog
          noteId={noteId}
          noteTitle={noteTitle}
          noteContent={noteContent}
          open={showExport}
          onOpenChange={setShowExport}
        />
      )}

      {/* 版本历史对话框 */}
      {showHistory && (
        <VersionHistory
          noteId={noteId}
          open={showHistory}
          onOpenChange={setShowHistory}
        />
      )}

      {/* 分享对话框 */}
      {showShare && (
        <ShareDialog
          noteId={noteId}
          noteTitle={noteTitle}
          isOwner={true}
          open={showShare}
          onOpenChange={setShowShare}
        />
      )}
    </>
  )
}
