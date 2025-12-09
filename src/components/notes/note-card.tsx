"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { useState, useEffect, useTransition } from "react"
import { indexedDBManager } from "@/lib/offline/indexeddb-manager"
import type { SyncStatus } from "@/types/offline"
import { useLoading } from "@/hooks/use-loading"
import { toast } from "sonner"
import { IconButtonLoader } from "@/components/ui/interactive-loader"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

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
    const router = useRouter()
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced')
    const [showStatusDialog, setShowStatusDialog] = useState(false)
    const { showLoading, hideLoading } = useLoading()
    const [isDeleting, setIsDeleting] = useState(false)
    const [isNavigating, setIsNavigating] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])
    const rippleIdRef = { current: 0 }

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

    // 添加水波纹效果
    const addRipple = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const id = rippleIdRef.current++
        
        setRipples(prev => [...prev, { x, y, id }])
        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== id))
        }, 600)
    }

    // 处理卡片点击导航
    const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // 如果点击的是按钮或链接，不处理
        if ((e.target as HTMLElement).closest('button, a')) {
            return
        }
        
        addRipple(e)
        setIsNavigating(true)
        
        startTransition(() => {
            router.push(`/notes/${note.id}`)
        })
    }

    const isLoading = isNavigating || isPending

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
        <Card 
            className={cn(
                "flex flex-col hover:shadow-lg transition-all cursor-pointer relative overflow-hidden",
                isLoading && "ring-2 ring-primary/50"
            )} 
            role="article" 
            aria-labelledby={`note-title-${note.id}`}
            onClick={handleCardClick}
        >
            {/* 水波纹效果 */}
            <AnimatePresence>
                {ripples.map(ripple => (
                    <motion.span
                        key={ripple.id}
                        className="absolute rounded-full bg-primary/20 pointer-events-none z-10"
                        style={{ left: ripple.x, top: ripple.y }}
                        initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0.5 }}
                        animate={{ width: 300, height: 300, x: -150, y: -150, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                ))}
            </AnimatePresence>

            {/* 加载进度条 */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        className="absolute top-0 left-0 right-0 h-1 bg-muted z-20 overflow-hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="h-full bg-primary"
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={cn("flex-1", isLoading && "opacity-70")} aria-label={`查看笔记: ${note.title}`}>
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
            </div>
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
                    <IconButtonLoader
                        icon={<Edit className="h-4 w-4" aria-hidden="true" />}
                        onClick={async () => {
                            setIsNavigating(true)
                            router.push(`/notes/${note.id}`)
                        }}
                        title={t('notes.editNote')}
                        className="min-h-[44px] min-w-[44px]"
                    />
                    <IconButtonLoader
                        icon={<Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />}
                        isLoading={isDeleting}
                        onClick={async () => {
                            if (confirm(t('notes.confirmDelete'))) {
                                setIsDeleting(true)
                                showLoading('正在删除笔记...', 'bounce')
                                try {
                                    await deleteNote(note.id)
                                    toast.success('笔记已删除')
                                } catch (error) {
                                    toast.error('删除失败')
                                } finally {
                                    setIsDeleting(false)
                                    hideLoading()
                                }
                            }
                        }}
                        title={t('notes.deleteNote')}
                        className="min-h-[44px] min-w-[44px] text-destructive hover:bg-destructive/10"
                    />
                </div>
            </CardFooter>

            {/* 同步状态详情对话框 */}
            <SyncStatusDialog
                noteId={note.id}
                open={showStatusDialog}
                onOpenChange={setShowStatusDialog}
            />
        </Card>
        </motion.div>
    )
}
