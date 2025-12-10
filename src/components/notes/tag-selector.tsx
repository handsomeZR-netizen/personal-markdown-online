"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getTags, createTag } from "@/lib/actions/tags"
import { t } from "@/lib/i18n"
import { X, Plus } from "lucide-react"
import { toast } from "sonner"

interface Tag {
    id: string
    name: string
}

interface TagSelectorProps {
    selectedTagIds: string[]
    onChange: (tagIds: string[]) => void
}

export function TagSelector({ selectedTagIds, onChange }: TagSelectorProps) {
    const [tags, setTags] = useState<Tag[]>([])
    const [isCreating, setIsCreating] = useState(false)
    const [newTagName, setNewTagName] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function loadTags() {
            setIsLoading(true)
            try {
                const result = await getTags()
                if (result.success && result.data) {
                    setTags(result.data)
                } else {
                    console.error('Failed to load tags:', result.error)
                    setTags([])
                }
            } catch (error) {
                console.error('Error loading tags:', error)
                setTags([])
            } finally {
                setIsLoading(false)
            }
        }
        
        loadTags()
    }, [])

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return

        const result = await createTag(newTagName.trim())
        if (result.success && result.data) {
            setTags([...tags, result.data])
            onChange([...selectedTagIds, result.data.id])
            setNewTagName("")
            setIsCreating(false)
            toast.success(t('tags.createSuccess'))
        } else {
            toast.error(t('tags.createError'))
        }
    }

    const handleRemoveTag = (tagId: string) => {
        onChange(selectedTagIds.filter(id => id !== tagId))
    }

    const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id))

    if (isLoading) {
        return <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
    }

    return (
        <div className="space-y-3">
            {/* Selected tags display area */}
            <div className="min-h-[42px] p-3 border border-neutral-200 rounded-lg bg-neutral-50 flex flex-wrap gap-2 items-start">
                {selectedTags.length > 0 ? (
                    selectedTags.map(tag => (
                        <div
                            key={tag.id}
                            className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-neutral-900 text-white rounded-md hover:bg-neutral-800 transition-all"
                        >
                            <span>{tag.name}</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveTag(tag.id)}
                                className="opacity-0 group-hover:opacity-100 hover:bg-neutral-700 rounded-sm p-0.5 transition-all"
                                aria-label={`删除标签 ${tag.name}`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))
                ) : (
                    <span className="text-sm text-neutral-400">暂无标签，点击下方按钮创建或使用AI建议</span>
                )}
            </div>

            {/* Create new tag */}
            {!isCreating ? (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreating(true)}
                    className="w-full sm:w-auto"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('tags.createTag')}
                </Button>
            ) : (
                <div className="flex gap-2 flex-wrap">
                    <Input
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder={t('tags.tagName')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                handleCreateTag()
                            }
                            if (e.key === 'Escape') {
                                setIsCreating(false)
                                setNewTagName("")
                            }
                        }}
                        className="flex-1 min-w-[200px]"
                        autoFocus
                    />
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleCreateTag}
                    >
                        {t('common.create')}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setIsCreating(false)
                            setNewTagName("")
                        }}
                    >
                        {t('common.cancel')}
                    </Button>
                </div>
            )}
        </div>
    )
}
