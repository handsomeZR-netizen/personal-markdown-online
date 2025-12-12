"use client"

import { memo, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Eye, Pencil } from "lucide-react"
import { deleteNote } from "@/lib/actions/notes"
import { t } from "@/lib/i18n"
import { formatDate } from "@/lib/i18n/date-format"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type NoteCardProps = {
    note: {
        id: string
        title: string
        content: string
        summary?: string | null
        createdAt: Date
        updatedAt: Date
        tags?: Array<{ id: string; name: string }>
        category?: { id: string; name: string } | null
        isShared?: boolean
        isOwner?: boolean
        collaboratorRole?: string | null
    }
    /** 使用事件委托时，由父组件处理点击 */
    onNavigate?: (noteId: string) => void
    /** 使用事件委托时，由父组件处理删除 */
    onDelete?: (noteId: string) => void
}

/**
 * 优化版笔记卡片组件
 * 
 * 优化点：
 * 1. 使用 React.memo 避免不必要的重渲染
 * 2. 移除 framer-motion 动画（改用 CSS 动画）
 * 3. 移除 TooltipProvider（改用原生 title 属性）
 * 4. 移除 IndexedDB 同步状态检查（延迟加载）
 * 5. 简化事件处理
 */
function OptimizedNoteCardComponent({ note, onNavigate, onDelete }: NoteCardProps) {
    const router = useRouter()

    // 使用 AI 生成的摘要，如果没有则取前100个字符
    const summary = note.summary || (note.content.length > 100 
        ? note.content.substring(0, 100) + '...' 
        : note.content)
    
    const isAISummary = !!note.summary

    const handleCardClick = useCallback((e: React.MouseEvent) => {
        // 如果点击的是按钮，不处理
        if ((e.target as HTMLElement).closest('button')) {
            return
        }
        
        if (onNavigate) {
            onNavigate(note.id)
        } else {
            router.push(`/notes/${note.id}`)
        }
    }, [note.id, onNavigate, router])

    const handleDelete = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (confirm(t('notes.confirmDelete'))) {
            if (onDelete) {
                onDelete(note.id)
            } else {
                try {
                    await deleteNote(note.id)
                    toast.success('笔记已删除')
                } catch (error) {
                    toast.error('删除失败')
                }
            }
        }
    }, [note.id, onDelete])

    const handleEdit = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        router.push(`/notes/${note.id}/edit`)
    }, [note.id, router])

    return (
        <Card 
            className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
            role="article" 
            aria-labelledby={`note-title-${note.id}`}
            onClick={handleCardClick}
        >
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <CardTitle 
                            id={`note-title-${note.id}`} 
                            className="truncate text-base"
                            title={note.title}
                        >
                            {note.title}
                        </CardTitle>
                        {/* 协作标识 - 简化版 */}
                        {note.isShared && !note.isOwner && (
                            <Badge 
                                variant="secondary" 
                                className="shrink-0 gap-1 text-xs bg-primary/10 text-primary border-primary/20"
                                title={`这是共享给你的笔记，你拥有${note.collaboratorRole === 'editor' ? '编辑' : '只读'}权限`}
                            >
                                {note.collaboratorRole === 'editor' ? (
                                    <><Pencil className="h-3 w-3" />协作</>
                                ) : (
                                    <><Eye className="h-3 w-3" />只读</>
                                )}
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="space-y-2 flex-1">
                {/* 摘要 - 使用原生 title 替代 Tooltip */}
                <p 
                    className="text-muted-foreground line-clamp-2 text-sm leading-relaxed"
                    title={summary}
                >
                    {summary}
                </p>
                {isAISummary && (
                    <span className="text-xs italic text-muted-foreground/70">AI 生成</span>
                )}
                
                {/* 标签 - 限制显示数量 */}
                {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {note.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag.id} variant="secondary" className="text-xs">
                                {tag.name}
                            </Badge>
                        ))}
                        {note.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                                +{note.tags.length - 3}
                            </Badge>
                        )}
                    </div>
                )}
                
                {/* 分类 */}
                {note.category && (
                    <Badge variant="outline" className="text-xs w-fit">
                        {note.category.name}
                    </Badge>
                )}
            </CardContent>
            
            <CardFooter className="flex justify-between items-center pt-3 border-t">
                <time 
                    className="text-xs text-muted-foreground"
                    dateTime={note.updatedAt.toISOString()}
                >
                    {formatDate(note.updatedAt)}
                </time>
                <div className="flex gap-1">
                    <button
                        onClick={handleEdit}
                        className="p-2 rounded-md hover:bg-muted transition-colors"
                        title={t('notes.editNote')}
                        aria-label={t('notes.editNote')}
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-2 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                        title={t('notes.deleteNote')}
                        aria-label={t('notes.deleteNote')}
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </CardFooter>
        </Card>
    )
}

// 使用 memo 优化，只在 note.id 或 note.updatedAt 变化时重渲染
export const OptimizedNoteCard = memo(OptimizedNoteCardComponent, (prev, next) => {
    return (
        prev.note.id === next.note.id &&
        prev.note.updatedAt.getTime() === next.note.updatedAt.getTime() &&
        prev.note.title === next.note.title
    )
})
