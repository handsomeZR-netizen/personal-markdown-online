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
import { t } from "@/lib/i18n"
import { Loader2, Check, Edit, Eye, WifiOff, Cloud } from "lucide-react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcuts"
import { useNetworkStatus } from "@/contexts/network-status-context"
import { offlineStorageService } from "@/lib/offline/offline-storage-service"

const formSchema = z.object({
    title: z.string().min(1, t('notes.titleRequired')),
    content: z.string(),
    tagIds: z.array(z.string()).optional(),
    categoryId: z.string().optional(),
})

interface NoteEditorProps {
    note?: {
        id: string
        title: string
        content: string
        tags?: Array<{ id: string; name: string }>
        categoryId?: string | null
    }
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function NoteEditor({ note }: NoteEditorProps) {
    const router = useRouter()
    const { isOnline } = useNetworkStatus()
    
    // 获取当前用户 ID（从 session 或其他地方）
    const [userId, setUserId] = useState<string | null>(null)
    
    useEffect(() => {
        // 获取当前用户 ID
        async function fetchUserId() {
            try {
                const response = await fetch('/api/auth/session')
                const session = await response.json()
                setUserId(session?.user?.id || null)
            } catch (error) {
                console.error('Failed to fetch user session:', error)
            }
        }
        fetchUserId()
    }, [])
    
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
    
    // Get draft auto-save interval from settings
    const [draftInterval, setDraftInterval] = useState(3000)
    
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

    // Auto-save effect
    useEffect(() => {
        if (!note?.id) return // Only auto-save for existing notes
        if (!debouncedTitle) return
        if (!userId) return

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
                setSaveStatus('saved')
                setTimeout(() => setSaveStatus('idle'), 2000)
            } else {
                setSaveStatus('error')
                setTimeout(() => setSaveStatus('idle'), 2000)
            }
        }

        performAutoSave()
    }, [debouncedTitle, debouncedContent, debouncedTagIds, debouncedCategoryId, note, isOnline, userId])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!userId) {
            toast.error('用户未登录')
            return
        }

        // 如果离线，保存到本地存储
        if (!isOnline) {
            try {
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
            } catch (error) {
                console.error('离线保存失败:', error)
                toast.error('保存失败')
            }
            return
        }

        // 在线模式：使用原有的服务器保存逻辑
        const formData = new FormData()
        formData.append("title", values.title)
        formData.append("content", values.content)
        formData.append("tagIds", JSON.stringify(selectedTagIds))
        if (selectedCategoryId) {
            formData.append("categoryId", selectedCategoryId)
        }

        try {
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
        } catch (error) {
            toast.error(t('notes.createError'))
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

    return (
        <>
            <DraftRecoveryDialog
                draft={draftToRecover}
                open={showDraftDialog}
                onRecover={handleRecoverDraft}
                onDiscard={handleDiscardDraft}
            />
            
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" aria-label={note ? t('notes.editNote') : t('notes.createNote')}>
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
                <div className="space-y-3">
                    <FormLabel>{t('tags.tags')}</FormLabel>
                    <TagSelector
                        selectedTagIds={selectedTagIds}
                        onChange={(tagIds) => {
                            setSelectedTagIds(tagIds)
                            form.setValue('tagIds', tagIds)
                        }}
                    />
                    
                    {/* AI Tag Suggestions */}
                    <AITagSuggestions
                        content={watchedContent}
                        title={title}
                        onAddTags={async (tagNames) => {
                            try {
                                // Import getTags and createTag from actions
                                const { getTags, createTag } = await import('@/lib/actions/tags')
                                
                                // Get all tags
                                const tagsResult = await getTags()
                                
                                if (!tagsResult.success || !tagsResult.data) {
                                    toast.error('获取标签失败')
                                    return
                                }
                                
                                const newTagIds = [...selectedTagIds]
                                
                                // Process each suggested tag
                                for (const tagName of tagNames) {
                                    // Check if tag exists
                                    const existingTag = tagsResult.data.find(tag => tag.name === tagName)
                                    let tagId = existingTag?.id
                                    
                                    // If tag doesn't exist, create it
                                    if (!tagId) {
                                        const result = await createTag(tagName)
                                        if (result.success && result.data) {
                                            tagId = result.data.id
                                            // Add to local tags list for next iteration
                                            tagsResult.data.push(result.data)
                                        } else {
                                            console.error(`创建标签失败: ${tagName}`)
                                            continue
                                        }
                                    }
                                    
                                    // Add tag to selected tags if not already selected
                                    if (tagId && !newTagIds.includes(tagId)) {
                                        newTagIds.push(tagId)
                                    }
                                }
                                
                                // Update state
                                setSelectedTagIds(newTagIds)
                                form.setValue('tagIds', newTagIds)
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
                
                <div className="space-y-2">
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
                    <div className="flex items-center gap-2">
                        <EditorToolbar onInsert={insertMarkdown} />
                        <AIFormatButton 
                            content={watchedContent}
                            onFormatted={(formattedContent) => {
                                form.setValue("content", formattedContent)
                                setContent(formattedContent)
                            }}
                        />
                    </div>
                    
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
                                <FormField
                                    control={form.control}
                                    name="content"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Textarea
                                                    placeholder={t('notes.content')}
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
                            </TabsContent>
                            <TabsContent value="preview" className="mt-4" role="tabpanel">
                                <div className="min-h-[500px] border rounded-md p-4 overflow-auto bg-muted/30" aria-label="Markdown预览">
                                    <MarkdownPreview content={content} />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* 桌面端：可调整大小的并排显示编辑器和预览 */}
                    <div className="hidden lg:block border rounded-lg overflow-hidden">
                        <PanelGroup direction="horizontal">
                            {/* Editor pane */}
                            <Panel defaultSize={50} minSize={30}>
                                <div className="h-full flex flex-col p-4">
                                    <div className="text-sm font-medium text-muted-foreground mb-2">
                                        {t('notes.editor')}
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="content"
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    <Textarea
                                                        placeholder={t('notes.content')}
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
                
                <div className="flex justify-end gap-4" role="group" aria-label="表单操作">
                    <Button type="button" variant="outline" onClick={() => router.back()} aria-label={t('common.cancel')}>
                        {t('common.cancel')}
                    </Button>
                    <Button type="submit" aria-label={t('common.save')}>{t('common.save')}</Button>
                </div>
            </form>
        </Form>
        </>
    )
}
