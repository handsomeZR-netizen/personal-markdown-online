"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { indexedDBManager } from "@/lib/offline/indexeddb-manager"
import { syncEngine } from "@/lib/offline/sync-engine"
import type { SyncStatus, SyncOperation } from "@/types/offline"
import { formatDate } from "@/lib/i18n/date-format"
import { toast } from "sonner"

interface SyncStatusDialogProps {
  noteId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SyncStatusDetails {
  status: SyncStatus
  lastSyncTime?: number
  error?: string
  operations: SyncOperation[]
}

export function SyncStatusDialog({ noteId, open, onOpenChange }: SyncStatusDialogProps) {
  const [details, setDetails] = useState<SyncStatusDetails | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    if (open) {
      loadSyncDetails()
    }
  }, [open, noteId])

  const loadSyncDetails = async () => {
    try {
      const localNote = await indexedDBManager.getNote(noteId)
      const syncQueue = await indexedDBManager.getSyncQueue()
      const noteOperations = syncQueue.filter(op => op.noteId === noteId)
      const lastSyncTime = await indexedDBManager.getMetadata<number>(`lastSync_${noteId}`)

      setDetails({
        status: localNote?.syncStatus || 'synced',
        lastSyncTime: lastSyncTime || undefined,
        error: noteOperations.find(op => op.status === 'failed')?.error,
        operations: noteOperations,
      })
    } catch (error) {
      console.error('Failed to load sync details:', error)
      toast.error('加载同步详情失败')
    }
  }

  const handleRetrySync = async () => {
    if (!details) return

    setIsRetrying(true)
    try {
      // 找到失败的操作并重试
      const failedOperations = details.operations.filter(op => op.status === 'failed')
      
      if (failedOperations.length === 0) {
        toast.info('没有需要重试的操作')
        return
      }

      // 重置操作状态为 pending
      for (const operation of failedOperations) {
        await indexedDBManager.updateSyncOperation({
          ...operation,
          status: 'pending',
          retryCount: 0,
          error: undefined,
        })
      }

      // 触发同步
      const result = await syncEngine.startSync()
      
      if (result.success > 0) {
        toast.success(`成功同步 ${result.success} 个操作`)
        await loadSyncDetails()
      } else if (result.failed > 0) {
        toast.error(`同步失败: ${result.errors[0]?.error || '未知错误'}`)
      }
    } catch (error) {
      console.error('Failed to retry sync:', error)
      toast.error('重试同步失败')
    } finally {
      setIsRetrying(false)
    }
  }

  const getStatusBadge = (status: SyncStatus) => {
    const config = {
      synced: { label: '已同步', variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      pending: { label: '待同步', variant: 'secondary' as const, icon: Clock, color: 'text-gray-600' },
      syncing: { label: '同步中', variant: 'default' as const, icon: RefreshCw, color: 'text-blue-600' },
      failed: { label: '同步失败', variant: 'destructive' as const, icon: AlertCircle, color: 'text-red-600' },
    }

    const { label, variant, icon: Icon, color } = config[status]

    return (
      <Badge variant={variant} className="gap-1">
        <Icon className={`h-3 w-3 ${color}`} />
        {label}
      </Badge>
    )
  }

  const getOperationTypeLabel = (type: string) => {
    const labels = {
      create: '创建',
      update: '更新',
      delete: '删除',
    }
    return labels[type as keyof typeof labels] || type
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>同步状态详情</DialogTitle>
          <DialogDescription>
            查看笔记的同步状态和历史记录
          </DialogDescription>
        </DialogHeader>

        {details ? (
          <div className="space-y-4">
            {/* 当前状态 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">当前状态</h4>
              <div className="flex items-center gap-2">
                {getStatusBadge(details.status)}
              </div>
            </div>

            {/* 最后同步时间 */}
            {details.lastSyncTime && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">最后同步时间</h4>
                <p className="text-sm text-muted-foreground">
                  {formatDate(new Date(details.lastSyncTime))}
                </p>
              </div>
            )}

            {/* 错误信息 */}
            {details.error && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-destructive">错误信息</h4>
                <div className="rounded-md bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">{details.error}</p>
                </div>
              </div>
            )}

            {/* 同步操作历史 */}
            {details.operations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">同步操作历史</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {details.operations.map((operation) => (
                    <div
                      key={operation.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {getOperationTypeLabel(operation.type)}
                          </span>
                          {getStatusBadge(operation.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(new Date(operation.timestamp))}
                        </p>
                        {operation.error && (
                          <p className="text-xs text-destructive">{operation.error}</p>
                        )}
                      </div>
                      {operation.retryCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          重试 {operation.retryCount} 次
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 无操作历史 */}
            {details.operations.length === 0 && details.status === 'synced' && (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  笔记已完全同步，无待处理操作
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        <DialogFooter>
          {details && (details.status === 'failed' || details.operations.some(op => op.status === 'failed')) && (
            <Button
              onClick={handleRetrySync}
              disabled={isRetrying}
              className="gap-2"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  重试中...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  重试同步
                </>
              )}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
