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
import { MarkdownPreview } from "./markdown-preview"
import { EditorToolbar } from "./editor-toolbar"
import { TagSelector } from "./tag-selector"
import { CategorySelector } from "./category-selector"
import { AITagSuggestions } from "./ai-tag-suggestions"
import { AIFormatButton } from "./ai-format-button"
import { t } from "@/lib/i18n"
import { Loader2, Check, Edit, Eye } from "lucide-react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcuts"

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
    
    // 使用用户 ID 作为缓存键的一部分，确保不同用户的缓存隔离
    const cacheKey = userId 
        ? (note?.id ? `note-draft-${userId}-${note.id}` : `note-draft-${userId}-new`)
        : null
    
    // 尝试从本地存储恢复草稿
    const [content, setContent] = useState(() => {
        if (typeof window !== 'undefined' && cacheKey) {
            const cached = localStorage.getItem(cacheKey)
            if (cached) {
                try {
                    const parsed = JSON.parse(cached)
                    // 验证缓存的用户 ID 是否匹配
                    if (parsed.userId !== userId) {
                        // 用户不匹配，清除缓存
                        localStorage.removeItem(cacheKey)
                        return note?.content || ""
                    }
                    // 如果缓存时间在 24 小时内，使用缓存
                    if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
                        // 只有当缓存内容与原内容不同时才提示
                        if (parsed.content !== note?.content) {
                            setTimeout(() => {
                                toast.info('已恢复未保存的草稿')
                            }, 500)
                        }
                        return parsed.content || note?.content || ""
                    }
                } catch (e) {
                    // 忽略解析错误
                }
            }
        }
        return note?.content || ""
    })
    
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>(note?.tags?.map(t => t.id) || [])
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(note?.categoryId || undefined)
    
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
    
    // Debounce the form values for auto-save (3 seconds)
    const [debouncedTitle] = useDebounce(title, 3000)
    const [debouncedContent] = useDebounce(watchedContent, 3000)
    const [debouncedTagIds] = useDebounce(selectedTagIds, 3000)
    const [debouncedCategoryId] = useDebounce(selectedCategoryId, 3000)

    // 本地存储缓存 - 防止内容丢失（带用户 ID 验证）
    useEffect(() => {
        if (typeof window !== 'undefined' && watchedContent && cacheKey && userId) {
            localStorage.setItem(cacheKey, JSON.stringify({
                content: watchedContent,
                title: title,
                userId: userId, // 保存用户 ID 用于验证
                timestamp: Date.now()
            }))
        }
    }, [watchedContent, title, cacheKey, userId])

    // Auto-save effect
    useEffect(() => {
        if (!note?.id) return // Only auto-save for existing notes
        if (!debouncedTitle) return

        const performAutoSave = async () => {
            setSaveStatus('saving')
            const result = await autoSaveNote(note.id, {
                title: debouncedTitle,
                content: debouncedContent,
                tagIds: debouncedTagIds,
                categoryId: debouncedCategoryId,
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
    }, [debouncedTitle, debouncedContent, debouncedTagIds, debouncedCategoryId, note])

    async function onSubmit(values: z.infer<typeof formSchema>) {
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
            
            // 清除本地缓存
            if (typeof window !== 'undefined' && cacheKey) {
                localStorage.removeItem(cacheKey)
            }
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
                        {/* Save status indicator */}
                        {note?.id && (
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
    )
}
