"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { createNote, updateNote, autoSaveNote } from "@/lib/actions/notes"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useDebounce } from "use-debounce"
import { useDebouncedCallback } from "use-debounce"
import { draftManager } from "@/lib/offline/draft-manager"
import { DraftRecoveryDialog } from "@/components/offline/draft-recovery-dialog"
import { OfflineSettingsManager } from "@/lib/offline/settings-manager"
import type { DraftContent } from "@/types/offline"
import { MarkdownPreview } from "./markdown-preview"
import { EditorToolbar } from "./editor-toolbar"
import { TagSelector } from "./tag-selector"
import { CategorySelector } from "./category-selector"
import { AITagSuggestions } from "./ai-tag-suggestions"
import { AIFormatButton } from "./ai-format-button"
import { AIWritingAssistantButton } from "./ai-writing-assistant-button"
import { t } from "@/lib/i18n"
import { Loader2, Check, Edit, Eye, WifiOff, PanelLeftClose, PanelLeft, Maximize2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRef, useCallback } from "react"
import { NoteActionsToolbar } from "./note-actions-toolbar"
import { LoadingButton } from "@/components/ui/loading-button"
import { useLoading } from "@/hooks/use-loading"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcuts"
import { useNetworkStatus } from "@/contexts/network-status-context"
import { offlineStorageService } from "@/lib/offline/offline-storage-service"
import { ImageUploadZone } from "./image-upload-zone"

const formSchema = z.object({
    title: z.string().min(1, t('notes.titleRequired')),
    content: z.string(),
    tagIds: z.array(z.string()).optional(),
    categoryId: z.string().optional(),
})

interface RecentNote {
    id: string
    title: string
    updatedAt: Date
}

interface NoteEditorProps {
    note?: {
        id: string
        title: string
        content: string
        tags?: Array<{ id: string; name: string }>
        categoryId?: string | null
    }
    userId?: string | null
    recentNotes?: RecentNote[]
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function NoteEditor({ note, userId: propUserId, recentNotes = [] }: NoteEditorProps) {
    const router = useRouter()
    const { isOnline } = useNetworkStatus()
    const { showLoading, hideLoading } = useLoading()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    
    // 使用传入的 userId 或从 localStorage 获取
    const [userId, setUserId] = useState<string | null>(propUserId || null)
    
    useEffect(() => {
        if (!userId) {
            // 尝试从 localStorage 获取（如果之前保存过）
            try {
                const storedUserId = localStorage.getItem('userId')
                if (storedUserId) {
                    setUserId(storedUserId)
                }
            } catch (error) {
                console.error('Failed to get user ID:', error)
            }
        }
    }, [userId])
    
    // 检查是否有草稿需要恢复
    useEffect(() => {
        if (!userId) return;
        
        const noteId = note?.id || 'new';
        const draft = draftManager.getDraft(noteId);
        
        if (draft) {
            // 检查草稿内容是否与当前笔记不同
            const isDifferent = 
                draft.title !== (note?.title || '') ||
                draft.content !== (note?.content || '') ||
                JSON.stringify(draft.tags) !== JSON.stringify(note?.tags?.map(t => t.id) || []) ||
                draft.categoryId !== (note?.categoryId || undefined);
            
            if (isDifferent) {
                setDraftToRecover(draft);
                setShowDraftDialog(true);
            }
        }
    }, [userId, note])
    

    
    const [content, setContent] = useState(note?.content || "")
    
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>(note?.tags?.map(t => t.id) || [])
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(note?.categoryId || undefined)
    const [tagRefreshKey, setTagRefreshKey] = useState(0)
    
    // 草稿恢复相关状态
    const [draftToRecover, setDraftToRecover] = useState<DraftContent | null>(null)
    const [showDraftDialog, setShowDraftDialog] = useState(false)
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: note?.title || "",
            content: content,
            tagIds: note?.tags?.map(t => t.id) || [],
            categoryId: note?.categoryId || undefined,
        },
    })

    const title = form.watch("title")
    const watchedContent = form.watch("content")
    
    // Get draft auto-save interval from settings (default 10 seconds)
    const [draftInterval, setDraftInterval] = useState(10000)
    
    useEffect(() => {
        const settings = OfflineSettingsManager.getSettings()
        setDraftInterval(settings.draftAutoSaveInterval)
        
        // Listen for settings changes
        const unsubscribe = OfflineSettingsManager.onSettingsChange((newSettings) => {
            setDraftInterval(newSettings.draftAutoSaveInterval)
        })
        
        return unsubscribe
    }, [])
    
    // Debounce the form values for auto-save (using settings interval)
    const [debouncedTitle] = useDebounce(title, draftInterval)
    const [debouncedContent] = useDebounce(watchedContent, draftInterval)
    const [debouncedTagIds] = useDebounce(selectedTagIds, draftInterval)
    const [debouncedCategoryId] = useDebounce(selectedCategoryId, draftInterval)

    // 恢复草稿
    const handleRecoverDraft = () => {
        if (!draftToRecover) return;
        
        form.setValue('title', draftToRecover.title);
        form.setValue('content', draftToRecover.content);
        setContent(draftToRecover.content);
        setSelectedTagIds(draftToRecover.tags);
        form.setValue('tagIds', draftToRecover.tags);
        
        if (draftToRecover.categoryId) {
            setSelectedCategoryId(draftToRecover.categoryId);
            form.setValue('categoryId', draftToRecover.categoryId);
        }
        
        setShowDraftDialog(false);
        toast.success('已恢复草稿');
    };
    
    // 放弃草稿
    const handleDiscardDraft = () => {
        const noteId = note?.id || 'new';
        draftManager.deleteDraft(noteId);
        setShowDraftDialog(false);
        setDraftToRecover(null);
        toast.info('已放弃草稿');
    };
    
    // 使用 draft manager 自动保存草稿（使用设置中的间隔）
    const saveDraftDebounced = useDebouncedCallback(() => {
        if (!userId) return;
        
        const noteId = note?.id || 'new';
        
        draftManager.saveDraft(noteId, {
            title: title,
            content: watchedContent,
            tags: selectedTagIds,
            categoryId: selectedCategoryId,
            savedAt: Date.now(),
        });
    }, draftInterval);

    // 监听表单变化，触发自动保存
    useEffect(() => {
        if (title || watchedContent) {
            saveDraftDebounced();
        }
    }, [title, watchedContent, selectedTagIds, selectedCategoryId, saveDraftDebounced])

    // 记录上次保存的内容，避免重复保存
    const [lastSavedContent, setLastSavedContent] = useState({ title: note?.title || '', content: note?.content || '' })

    // Auto-save effect
    useEffect(() => {
        if (!note?.id) return // Only auto-save for existing notes
        if (!debouncedTitle) return
        if (!userId) return
        
        // 检查内容是否真的变化了
        if (debouncedTitle === lastSavedContent.title && debouncedContent === lastSavedContent.content) {
            return // 内容没变，不需要保存
        }

        const performAutoSave = async () => {
            setSaveStatus('saving')
            
            // 如果离线，保存到本地存储
            if (!isOnline) {
                try {
                    await offlineStorageService.updateNote(
                        note.id,
                        {
                            title: debouncedTitle,
                            content: debouncedContent,
                            tags: debouncedTagIds,
                            categoryId: debouncedCategoryId,
                        },
                        userId
                    )
                    setSaveStatus('saved')
                    setTimeout(() => setSaveStatus('idle'), 2000)
                } catch (error) {
                    console.error('离线自动保存失败:', error)
                    setSaveStatus('error')
                    setTimeout(() => setSaveStatus('idle'), 2000)
                }
                return
            }

            // 在线模式：使用原有的自动保存逻辑
            const result = await autoSaveNote(note.id, {
                title: debouncedTitle,
                content: debouncedContent,
            })

            if (result.success) {
                setLastSavedContent({ title: debouncedTitle, content: debouncedContent })
                setSaveStatus('saved')
                setTimeout(() => setSaveStatus('idle'), 2000)
            } else {
                setSaveStatus('error')
                setTimeout(() => setSaveStatus('idle'), 2000)
            }
        }

        performAutoSave()
    }, [debouncedTitle, debouncedContent, note, isOnline, userId, lastSavedContent])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!userId) {
            toast.error('用户未登录')
            return
        }

        setIsSubmitting(true)
        showLoading(note ? '正在保存笔记...' : '正在创建笔记...', 'orbit')

        try {
            // 如果离线，保存到本地存储
            if (!isOnline) {
                const result = await offlineStorageService.saveNote(
                    {
                        id: note?.id,
                        title: values.title,
                        content: values.content,
                        tags: selectedTagIds,
                        categoryId: selectedCategoryId,
                    },
                    userId
                )

                if (result.success) {
                    toast.success(note ? '笔记已保存到本地，将在网络恢复后同步' : '笔记已创建并保存到本地，将在网络恢复后同步')
                    
                    // 清除草稿
                    const noteId = note?.id || 'new';
                    draftManager.deleteDraft(noteId);
                    
                    // 如果是新笔记，跳转到笔记列表
                    if (!note) {
                        router.push('/notes')
                    }
                }
            } else {
                // 在线模式：使用原有的服务器保存逻辑
                const formData = new FormData()
                formData.append("title", values.title)
                formData.append("content", values.content)
                formData.append("tagIds", JSON.stringify(selectedTagIds))
                if (selectedCategoryId) {
                    formData.append("categoryId", selectedCategoryId)
                }

                if (note) {
                    await updateNote(note.id, formData)
                    toast.success(t('notes.updateSuccess'))
                } else {
                    await createNote(formData)
                    toast.success(t('notes.createSuccess'))
                }
                
                // 清除草稿
                const noteId = note?.id || 'new';
                draftManager.deleteDraft(noteId);
            }
        } catch (error: unknown) {
            // Next.js redirect() throws a special error - don't show error toast for redirects
            // The error can have different formats depending on Next.js version
            const isRedirectError = 
                (error instanceof Error && error.message === 'NEXT_REDIRECT') ||
                (error instanceof Error && error.message.includes('NEXT_REDIRECT')) ||
                (typeof error === 'object' && error !== null && 'digest' in error && 
                 typeof (error as { digest?: string }).digest === 'string' && 
                 (error as { digest: string }).digest.includes('NEXT_REDIRECT'));
            
            if (isRedirectError) {
                // This is a successful redirect, not an error
                // Clear draft before redirect completes
                const noteId = note?.id || 'new';
                draftManager.deleteDraft(noteId);
                toast.success(note ? t('notes.updateSuccess') : t('notes.createSuccess'));
                return
            }
            console.error('Save note error:', error);
            toast.error(note ? t('notes.updateError') : t('notes.createError'))
        } finally {
            setIsSubmitting(false)
            hideLoading()
        }
    }

    const insertMarkdown = (before: string, after: string = "") => {
        const textarea = document.querySelector('textarea[name="content"]') as HTMLTextAreaElement
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = textarea.value
        const selectedText = text.substring(start, end)
        
        // 检查是否是行首标记（标题、列表等）
        const isLinePrefix = before.match(/^(#{1,6}\s|[-*]\s|\d+\.\s|>\s)$/)
        
        let newText: string
        let newCursorPos: number
        
        if (isLinePrefix) {
            // 对于行首标记，找到当前行的开始位置
            const lineStart = text.lastIndexOf('\n', start - 1) + 1
            const lineEnd = text.indexOf('\n', end)
            const actualLineEnd = lineEnd === -1 ? text.length : lineEnd
            const currentLine = text.substring(lineStart, actualLineEnd)
            
            // 如果当前行已经有相同的标记，则移除它
            const existingPrefix = currentLine.match(/^(#{1,6}\s|[-*]\s|\d+\.\s|>\s)/)
            if (existingPrefix && existingPrefix[0] === before) {
                // 移除现有标记
                newText = text.substring(0, lineStart) + 
                         currentLine.substring(before.length) + 
                         text.substring(actualLineEnd)
                newCursorPos = start - before.length
            } else {
                // 在行首添加标记
                newText = text.substring(0, lineStart) + 
                         before + 
                         currentLine + 
                         text.substring(actualLineEnd)
                newCursorPos = start + before.length
            }
        } else {
            // 对于包裹型标记（加粗、斜体等）
            newText = text.substring(0, start) + 
                     before + selectedText + after + 
                     text.substring(end)
            
            if (selectedText) {
                // 如果有选中文本，光标放在包裹后的文本之后
                newCursorPos = start + before.length + selectedText.length + after.length
            } else {
                // 如果没有选中文本，光标放在两个标记之间
                newCursorPos = start + before.length
            }
        }
        
        form.setValue("content", newText)
        setContent(newText)
        
        // 设置光标位置
        setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(newCursorPos, newCursorPos)
        }, 0)
    }

    // Ctrl/Cmd + S: 保存笔记
    useKeyboardShortcut('s', () => {
        form.handleSubmit(onSubmit)()
    }, { ctrl: true })

    // Ctrl/Cmd + B: 加粗
    useKeyboardShortcut('b', () => {
        insertMarkdown('**', '**')
    }, { ctrl: true })

    // Ctrl/Cmd + I: 斜体
    useKeyboardShortcut('i', () => {
        insertMarkdown('*', '*')
    }, { ctrl: true })

    // Ctrl/Cmd + L: 插入链接
    useKeyboardShortcut('l', () => {
        insertMarkdown('[', '](url)')
    }, { ctrl: true })

    // 左侧面板折叠状态
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

    // 魔法边框效果状态
    const editorContainerRef = useRef<HTMLDivElement>(null)
    const [editorMousePosition, setEditorMousePosition] = useState({ x: 0, y: 0 })
    const [isEditorHovered, setIsEditorHovered] = useState(false)
    // AI 格式化进行中状态 - 用于显示编辑器霓虹灯效果
    const [isAIFormatting, setIsAIFormatting] = useState(false)

    const handleEditorMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!editorContainerRef.current) return
        const rect = editorContainerRef.current.getBoundingClientRect()
        setEditorMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        })
    }, [])

    const handleEditorMouseEnter = useCallback(() => setIsEditorHovered(true), [])
    const handleEditorMouseLeave = useCallback(() => setIsEditorHovered(false), [])

    return (
        <>
            <DraftRecoveryDialog
                draft={draftToRecover}
                open={showDraftDialog}
                onRecover={handleRecoverDraft}
                onDiscard={handleDiscardDraft}
            />
            
            <Form {...form}>
                <form 
                    onSubmit={form.handleSubmit(onSubmit)} 
                    aria-label={note ? t('notes.editNote') : t('notes.createNote')}
                    className={cn(
                        "transition-all duration-300 ease-in-out",
                        isFullscreen && "fixed inset-0 z-50 bg-background flex flex-col"
                    )}
                >
                {/* 全屏模式下的固定工具栏 */}
                {isFullscreen && (
                    <div className="flex-shrink-0 bg-background border-b px-4 py-3 transition-all duration-300 ease-in-out">
                        <div className="flex items-center gap-2 flex-wrap">
                            <EditorToolbar onInsert={insertMarkdown} />
                            <AIFormatButton 
                                content={watchedContent}
                                onFormatted={(formattedContent) => {
                                    form.setValue("content", formattedContent)
                                    setContent(formattedContent)
                                }}
                                onFormattingChange={setIsAIFormatting}
                            />
                            <AIWritingAssistantButton
                                content={watchedContent}
                                onFormatted={(formattedContent) => {
                                    form.setValue("content", formattedContent)
                                    setContent(formattedContent)
                                }}
                                onFormattingChange={setIsAIFormatting}
                            />
                            <NoteActionsToolbar 
                                noteId={note?.id || 'new'}
                                noteTitle={title}
                                noteContent={watchedContent}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsFullscreen(false)}
                                title="退出全屏"
                                className="transition-transform duration-200 hover:scale-105"
                            >
                                <Minimize2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
                
                {/* 左右分栏布局 */}
                <div className={cn(
                    "flex flex-col lg:flex-row gap-4 transition-all duration-300 ease-in-out",
                    isFullscreen && "flex-1 overflow-auto p-4"
                )}>
                    {/* 左侧边栏：元数据 */}
                    <div className={`flex-shrink-0 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'lg:w-10' : 'lg:w-52'}`}>
                        {/* 折叠/展开按钮 */}
                        <div className="hidden lg:flex justify-end mb-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                className="h-8 w-8 p-0"
                                aria-label={isSidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'}
                            >
                                {isSidebarCollapsed ? (
                                    <PanelLeft className="h-4 w-4" />
                                ) : (
                                    <PanelLeftClose className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        
                        {/* 折叠时只显示展开按钮 */}
                        <div className={`space-y-3 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('notes.title')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('notes.title')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Tags selector */}
                        <div className="space-y-2">
                            <FormLabel>{t('tags.tags')}</FormLabel>
                            <TagSelector
                                selectedTagIds={selectedTagIds}
                                onChange={(tagIds) => {
                                    setSelectedTagIds(tagIds)
                                    form.setValue('tagIds', tagIds)
                                }}
                                refreshKey={tagRefreshKey}
                            />
                            
                            {/* AI Tag Suggestions */}
                            <AITagSuggestions
                                content={watchedContent}
                                title={title}
                                onAddTags={async (tagNames) => {
                                    try {
                                        const { getTags, createTag } = await import('@/lib/actions/tags')
                                        const tagsResult = await getTags()
                                        
                                        if (!tagsResult.success || !tagsResult.data) {
                                            toast.error('获取标签失败')
                                            return
                                        }
                                        
                                        const newTagIds = [...selectedTagIds]
                                        
                                        for (const tagName of tagNames) {
                                            const existingTag = tagsResult.data.find(tag => tag.name === tagName)
                                            let tagId = existingTag?.id
                                            
                                            if (!tagId) {
                                                const result = await createTag(tagName)
                                                if (result.success && result.data) {
                                                    tagId = result.data.id
                                                    tagsResult.data.push(result.data)
                                                } else {
                                                    continue
                                                }
                                            }
                                            
                                            if (tagId && !newTagIds.includes(tagId)) {
                                                newTagIds.push(tagId)
                                            }
                                        }
                                        
                                        setSelectedTagIds(newTagIds)
                                        form.setValue('tagIds', newTagIds)
                                        // 触发 TagSelector 刷新以显示新创建的标签
                                        setTagRefreshKey(prev => prev + 1)
                                    } catch (error) {
                                        console.error('添加AI标签失败:', error)
                                        toast.error('添加AI标签失败')
                                    }
                                }}
                            />
                        </div>

                        {/* Category selector */}
                        <div className="space-y-2">
                            <FormLabel>{t('categories.category')}</FormLabel>
                            <CategorySelector
                                selectedCategoryId={selectedCategoryId}
                                onChange={(categoryId) => {
                                    setSelectedCategoryId(categoryId)
                                    form.setValue('categoryId', categoryId)
                                }}
                            />
                        </div>

                        {/* 保存按钮 */}
                        <LoadingButton
                            type="submit"
                            className="w-full"
                            loading={isSubmitting}
                        >
                            {note ? t('common.save') : t('common.create')}
                        </LoadingButton>
                        
                        {/* 最近笔记 */}
                        {recentNotes.length > 0 && (
                            <div className="mt-6 pt-4 border-t">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xs text-muted-foreground">最近笔记</span>
                                </div>
                                <div className="space-y-1">
                                    {recentNotes.map((recentNote) => (
                                        <a
                                            key={recentNote.id}
                                            href={`/notes/${recentNote.id}/edit`}
                                            className="block p-2 rounded-md hover:bg-accent transition-colors text-sm truncate"
                                            title={recentNote.title || "无标题"}
                                        >
                                            {recentNote.title || "无标题"}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                        </div>
                    </div>

                    {/* 右侧：编辑器 */}
                    <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between">
                        <FormLabel>{t('notes.content')}</FormLabel>
                        <div className="flex items-center gap-3">
                            {/* Offline indicator */}
                            {!isOnline && (
                                <div className="flex items-center gap-2 text-sm text-amber-600" role="status" aria-live="polite">
                                    <WifiOff className="h-4 w-4" aria-hidden="true" />
                                    <span className="hidden sm:inline">离线模式</span>
                                </div>
                            )}
                            {/* Save status indicator */}
                            {note?.id && isOnline && (
                                <div className="flex items-center gap-2 text-sm" role="status" aria-live="polite">
                                    {saveStatus === 'saving' && (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
                                            <span className="hidden sm:inline text-muted-foreground">{t('notes.autoSaving')}</span>
                                        </>
                                    )}
                                    {saveStatus === 'saved' && (
                                        <>
                                            <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
                                            <span className="hidden sm:inline text-green-600">{t('notes.autoSaved')}</span>
                                        </>
                                    )}
                                    {saveStatus === 'error' && (
                                        <span className="text-destructive" role="alert">{t('common.error')}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* 非全屏模式下的 sticky 工具栏 */}
                    {!isFullscreen && (
                        <div className="sticky top-[73px] z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-3 pt-2 -mt-2 transition-all duration-300 ease-in-out">
                            <div className="flex items-center gap-2 flex-wrap">
                                <EditorToolbar onInsert={insertMarkdown} />
                                <AIFormatButton 
                                    content={watchedContent}
                                    onFormatted={(formattedContent) => {
                                        form.setValue("content", formattedContent)
                                        setContent(formattedContent)
                                    }}
                                    onFormattingChange={setIsAIFormatting}
                                />
                                <AIWritingAssistantButton
                                    content={watchedContent}
                                    onFormatted={(formattedContent) => {
                                        form.setValue("content", formattedContent)
                                        setContent(formattedContent)
                                    }}
                                    onFormattingChange={setIsAIFormatting}
                                />
                                <NoteActionsToolbar 
                                    noteId={note?.id || 'new'}
                                    noteTitle={title}
                                    noteContent={watchedContent}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsFullscreen(true)}
                                    title="全屏编辑"
                                    className="transition-transform duration-200 hover:scale-105"
                                >
                                    <Maximize2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                    
                    {/* 移动端：标签页切换编辑器和预览 */}
                    <div className="lg:hidden">
                        <Tabs defaultValue="editor" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 min-h-[44px]" role="tablist" aria-label="编辑器视图切换">
                                <TabsTrigger value="editor" className="min-h-[44px]" role="tab">
                                    <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                                    {t('notes.editor')}
                                </TabsTrigger>
                                <TabsTrigger value="preview" className="min-h-[44px]" role="tab">
                                    <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
                                    {t('notes.preview')}
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="editor" className="mt-4">
                                <ImageUploadZone
                                    noteId={note?.id}
                                    onImageInsert={(url) => {
                                        const textarea = document.querySelector('textarea[name="content"]') as HTMLTextAreaElement
                                        if (!textarea) return
                                        const start = textarea.selectionStart
                                        const end = textarea.selectionEnd
                                        const text = textarea.value
                                        const imageMarkdown = `\n![image](${url})\n`
                                        const newText = text.substring(0, start) + imageMarkdown + text.substring(end)
                                        form.setValue("content", newText)
                                        setContent(newText)
                                    }}
                                >
                                    <FormField
                                        control={form.control}
                                        name="content"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder={t('notes.content') + '\n\n💡 提示：可以直接粘贴或拖拽图片到这里'}
                                                        className="min-h-[500px] font-mono resize-none"
                                                        {...field}
                                                        onChange={(e) => {
                                                            field.onChange(e)
                                                            setContent(e.target.value)
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </ImageUploadZone>
                            </TabsContent>
                            <TabsContent value="preview" className="mt-4" role="tabpanel">
                                <div className="min-h-[500px] border rounded-md p-4 overflow-auto bg-muted/30" aria-label="Markdown预览">
                                    <MarkdownPreview content={content} />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* 桌面端：可调整大小的并排显示编辑器和预览 */}
                    <div
                        ref={editorContainerRef}
                        className="hidden lg:block relative group rounded-lg"
                        onMouseMove={handleEditorMouseMove}
                        onMouseEnter={handleEditorMouseEnter}
                        onMouseLeave={handleEditorMouseLeave}
                    >
                        {/* AI格式化霓虹灯效果 - 外发光层（模糊光晕） */}
                        {isAIFormatting && (
                            <div 
                                className="absolute -inset-2 rounded-xl pointer-events-none"
                                style={{
                                    background: `conic-gradient(from var(--border-angle, 0deg) at 50% 50%, 
                                        rgb(236, 72, 153) 0%, 
                                        rgb(139, 92, 246) 14%, 
                                        rgb(59, 130, 246) 28%, 
                                        rgb(34, 211, 238) 42%, 
                                        rgb(52, 211, 153) 56%, 
                                        rgb(250, 204, 21) 70%, 
                                        rgb(251, 146, 60) 84%, 
                                        rgb(236, 72, 153) 100%)`,
                                    animation: "border-beam 2s linear infinite",
                                    filter: "blur(12px)",
                                    opacity: 0.7,
                                    // 使用 mask 镂空中间，只保留边框发光
                                    mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                                    maskComposite: "xor",
                                    WebkitMaskComposite: "xor",
                                    padding: "8px",
                                }}
                            />
                        )}
                        
                        {/* AI格式化霓虹灯效果 - 清晰边框层 */}
                        {isAIFormatting && (
                            <div 
                                className="absolute -inset-[3px] rounded-lg pointer-events-none"
                                style={{
                                    background: `conic-gradient(from var(--border-angle, 0deg) at 50% 50%, 
                                        rgb(236, 72, 153) 0%, 
                                        rgb(139, 92, 246) 14%, 
                                        rgb(59, 130, 246) 28%, 
                                        rgb(34, 211, 238) 42%, 
                                        rgb(52, 211, 153) 56%, 
                                        rgb(250, 204, 21) 70%, 
                                        rgb(251, 146, 60) 84%, 
                                        rgb(236, 72, 153) 100%)`,
                                    animation: "border-beam 2s linear infinite",
                                    // 使用 mask 镂空中间，只保留 3px 边框
                                    mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                                    maskComposite: "xor",
                                    WebkitMaskComposite: "xor",
                                    padding: "3px",
                                }}
                            />
                        )}

                        {/* 流光渐变边框 - 普通 hover 效果 */}
                        {!isAIFormatting && (
                            <div
                                className={cn(
                                    "absolute -inset-[1px] rounded-lg pointer-events-none transition-opacity duration-500",
                                    "bg-gradient-to-r from-violet-500 via-blue-500 to-purple-600",
                                    "opacity-0 group-hover:opacity-20 dark:group-hover:opacity-50"
                                )}
                            />
                        )}

                        {/* 鼠标跟随光晕效果 */}
                        {!isAIFormatting && (
                            <div
                                className="absolute -inset-[1px] rounded-lg pointer-events-none transition-opacity duration-300"
                                style={{
                                    opacity: isEditorHovered ? 0.15 : 0,
                                    background: `radial-gradient(400px circle at ${editorMousePosition.x}px ${editorMousePosition.y}px, rgba(139, 92, 246, 0.4), transparent 40%)`,
                                }}
                            />
                        )}

                        {/* 流动边框光束动画 - 普通 hover 效果 */}
                        {!isAIFormatting && (
                            <div className="absolute -inset-[1px] rounded-lg pointer-events-none overflow-hidden">
                                <div
                                    className={cn(
                                        "absolute inset-0 transition-opacity duration-500",
                                        "opacity-0 dark:opacity-30",
                                        isEditorHovered && "opacity-10 dark:opacity-60"
                                    )}
                                    style={{
                                        background: `conic-gradient(from var(--border-angle, 0deg) at 50% 50%, transparent 0%, rgb(139, 92, 246) 10%, rgb(59, 130, 246) 20%, rgb(147, 51, 234) 30%, transparent 40%)`,
                                        animation: "border-beam 4s linear infinite",
                                    }}
                                />
                            </div>
                        )}

                        {/* 编辑器主容器 */}
                        <div className="relative border rounded-lg overflow-hidden bg-background z-10">
                        <PanelGroup direction="horizontal">
                            {/* Editor pane */}
                            <Panel defaultSize={50} minSize={30}>
                                <div className="h-full flex flex-col p-4">
                                    <div className="text-sm font-medium text-muted-foreground mb-2">
                                        {t('notes.editor')}
                                    </div>
                                    <ImageUploadZone
                                        noteId={note?.id}
                                        onImageInsert={(url) => {
                                            const textarea = document.querySelector('textarea[name="content"]') as HTMLTextAreaElement
                                            if (!textarea) return
                                            const start = textarea.selectionStart
                                            const end = textarea.selectionEnd
                                            const text = textarea.value
                                            const imageMarkdown = `\n![image](${url})\n`
                                            const newText = text.substring(0, start) + imageMarkdown + text.substring(end)
                                            form.setValue("content", newText)
                                            setContent(newText)
                                        }}
                                        className="flex-1"
                                    >
                                        <FormField
                                            control={form.control}
                                            name="content"
                                            render={({ field }) => (
                                                <FormItem className="h-full">
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder={t('notes.content') + '\n\n💡 提示：可以直接粘贴或拖拽图片到这里'}
                                                            className="h-full min-h-[500px] font-mono resize-none"
                                                            {...field}
                                                            onChange={(e) => {
                                                                field.onChange(e)
                                                                setContent(e.target.value)
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </ImageUploadZone>
                                </div>
                            </Panel>
                            
                            {/* Resize handle */}
                            <PanelResizeHandle className="w-2 bg-border hover:bg-accent transition-colors" />
                            
                            {/* Preview pane */}
                            <Panel defaultSize={50} minSize={30}>
                                <div className="h-full flex flex-col p-4">
                                    <div className="text-sm font-medium text-muted-foreground mb-2">
                                        {t('notes.preview')}
                                    </div>
                                    <div className="flex-1 min-h-[500px] border rounded-md p-4 overflow-auto bg-muted/30">
                                        <MarkdownPreview content={content} />
                                    </div>
                                </div>
                            </Panel>
                        </PanelGroup>
                        </div>
                    </div>
                    </div>
                    {/* 关闭右侧编辑器 div */}
                </div>
                {/* 关闭左右分栏布局 div */}
            </form>
        </Form>
        </>
    )
}
