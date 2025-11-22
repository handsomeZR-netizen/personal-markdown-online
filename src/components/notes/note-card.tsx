"use client"

import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Edit, Trash2 } from "lucide-react"
import { deleteNote } from "@/lib/actions/notes"
import { t } from "@/lib/i18n"
import { formatDate } from "@/lib/i18n/date-format"
import { SyncStatusIcon } from "@/components/offline/sync-status-icon"
import { SyncStatusDialog } from "@/components/offline/sync-status-dialog"
import { useState, useEffect } from "react"
import { indexedDBManager } from "@/lib/offline/indexeddb-manager"
import type { SyncStatus } from "@/types/offline"

type NoteCardProps = {
    note: {
        id: string
        title: string
        content: string
        summary?: string | null
        createdAt: Date
        updatedAt: Date
        tags: Array<{ id: string; name: string }>
        category: { id: string; name: string } | null
    }
}

export function NoteCard({ note }: NoteCardProps) {
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced')
    const [showStatusDialog, setShowStatusDialog] = useState(false)

    // 使用 AI 生成的摘要，如果没有则取前100个字符
    const summary = note.summary || (note.content.length > 100 
        ? note.content.substring(0, 100) + '...' 
        : note.content)
    
    // 判断是否为 AI 生成的摘要
    const isAISummary = !!note.summary

    // 从 IndexedDB 读取同步状态
    useEffect(() => {
        const loadSyncStatus = async () => {
            try {
                const localNote = await indexedDBManager.getNote(note.id)
                if (localNote) {
                    setSyncStatus(localNote.syncStatus)
                }
            } catch (error) {
                // 如果读取失败，保持默认的 'synced' 状态
                console.error('Failed to load sync status:', error)
            }
        }

        loadSyncStatus()
    }, [note.id])

    const handleSyncStatusClick = () => {
        setShowStatusDialog(true)
    }

    return (
        <Card className="flex flex-col hover:shadow-lg transition-shadow" role="article" aria-labelledby={`note-title-${note.id}`}>
            <Link href={`/notes/${note.id}`} className="flex-1 cursor-pointer" aria-label={`查看笔记: ${note.title}`}>
                <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                        <CardTitle id={`note-title-${note.id}`} className="truncate flex-1">{note.title}</CardTitle>
                        <div onClick={(e) => {
                            e.preventDefault()
                            handleSyncStatusClick()
                        }}>
                            <SyncStatusIcon status={syncStatus} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {/* 摘要显示 - 限制2-3行，悬停显示完整摘要 */}
                    <div className="space-y-1">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed cursor-help">
                                        {summary}
                                    </p>
                                </TooltipTrigger>
                                <TooltipContent 
                                    className="max-w-md p-3"
                                    side="bottom"
                                    align="start"
                                >
                                    <p className="text-sm whitespace-pre-wrap">{summary}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        {isAISummary && (
                            <span className="text-xs text-muted-foreground/70 italic">
                                AI 生成
                            </span>
                        )}
                    </div>
                    
                    {/* 标签 */}
                    {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1" role="list" aria-label="标签">
                            {note.tags.map((tag) => (
                                <Badge key={tag.id} variant="secondary" className="text-xs" role="listitem">
                                    {tag.name}
                                </Badge>
                            ))}
                        </div>
                    )}
                    
                    {/* 分类 */}
                    {note.category && (
                        <Badge variant="outline" className="text-xs w-fit" aria-label={`分类: ${note.category.name}`}>
                            {note.category.name}
                        </Badge>
                    )}
                </CardContent>
            </Link>
            <CardFooter className="flex justify-between items-center pt-4 border-t">
                <div className="flex flex-col text-xs text-muted-foreground" aria-label="笔记时间信息">
                    <time className="hidden sm:inline" dateTime={note.createdAt.toISOString()}>
                        {t('notes.createdAt')}: {formatDate(note.createdAt)}
                    </time>
                    <time dateTime={note.updatedAt.toISOString()}>
                        {t('notes.updatedAt')}: {formatDate(note.updatedAt)}
                    </time>
                </div>
                <div className="flex gap-2" role="group" aria-label="笔记操作">
                    <Link href={`/notes/${note.id}`}>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            title={t('notes.editNote')}
                            aria-label={t('notes.editNote')}
                            className="min-h-[44px] min-w-[44px]"
                        >
                            <Edit className="h-4 w-4" aria-hidden="true" />
                        </Button>
                    </Link>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive min-h-[44px] min-w-[44px]"
                        title={t('notes.deleteNote')}
                        aria-label={t('notes.deleteNote')}
                        onClick={async () => {
                            if (confirm(t('notes.confirmDelete'))) {
                                await deleteNote(note.id)
                            }
                        }}
                    >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                </div>
            </CardFooter>

            {/* 同步状态详情对话框 */}
            <SyncStatusDialog
                noteId={note.id}
                open={showStatusDialog}
                onOpenChange={setShowStatusDialog}
            />
        </Card>
    )
}
