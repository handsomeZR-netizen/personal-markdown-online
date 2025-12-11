"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, History, Share2 } from "lucide-react"
import dynamic from "next/dynamic"
import { SyncStatusIcon } from "@/components/offline/sync-status-icon"
import { indexedDBManager } from "@/lib/offline/indexeddb-manager"
import type { SyncStatus } from "@/types/offline"

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

const SyncStatusDialog = dynamic(() => import('@/components/offline/sync-status-dialog').then(mod => ({ default: mod.SyncStatusDialog })), {
  ssr: false
})

interface NoteActionsToolbarProps {
  noteId: string
  noteTitle: string
  noteContent: string
}

export function NoteActionsToolbar({ noteId, noteTitle, noteContent }: NoteActionsToolbarProps) {
  const [showSyncStatus, setShowSyncStatus] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced')

  // 加载同步状态
  useEffect(() => {
    if (noteId === 'new') return

    const loadSyncStatus = async () => {
      try {
        const localNote = await indexedDBManager.getNote(noteId)
        if (localNote) {
          setSyncStatus(localNote.syncStatus || 'synced')
        }
      } catch (error) {
        console.error('Failed to load sync status:', error)
      }
    }

    loadSyncStatus()

    // 定期检查同步状态
    const interval = setInterval(loadSyncStatus, 5000)
    return () => clearInterval(interval)
  }, [noteId])

  // 构建笔记数据对象用于导出
  const noteData = {
    id: noteId,
    title: noteTitle,
    content: noteContent,
  }

  return (
    <>
      {/* 同步状态图标 */}
      {noteId !== 'new' && (
        <SyncStatusIcon
          status={syncStatus}
          onClick={() => setShowSyncStatus(true)}
        />
      )}

      {/* 导出对话框 - 使用 trigger 模式 */}
      <ExportDialog
        note={noteData}
        trigger={
          <Button
            type="button"
            variant="outline"
            size="sm"
            title="导出笔记"
          >
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">导出</span>
          </Button>
        }
      />
      
      {/* 版本历史对话框 - 使用 trigger 模式 */}
      <VersionHistory
        noteId={noteId}
        trigger={
          <Button
            type="button"
            variant="outline"
            size="sm"
            title="查看版本历史"
          >
            <History className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">历史</span>
          </Button>
        }
      />
      
      {/* 分享按钮 */}
      <ShareButton noteId={noteId} noteTitle={noteTitle} />

      {/* 同步状态对话框 */}
      {showSyncStatus && noteId !== 'new' && (
        <SyncStatusDialog
          noteId={noteId}
          open={showSyncStatus}
          onOpenChange={setShowSyncStatus}
        />
      )}
    </>
  )
}

// 分享按钮组件，内部管理对话框状态
function ShareButton({ noteId, noteTitle }: { noteId: string; noteTitle: string }) {
  const [showShare, setShowShare] = useState(false)
  
  // 新建笔记时禁用分享功能
  const isNewNote = noteId === 'new'
  
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => !isNewNote && setShowShare(true)}
        title={isNewNote ? "请先保存笔记" : "分享笔记"}
        disabled={isNewNote}
      >
        <Share2 className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">分享</span>
      </Button>
      
      {!isNewNote && (
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
