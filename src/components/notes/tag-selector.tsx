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
        loadTags()
    }, [])

    const loadTags = async () => {
        setIsLoading(true)
        const result = await getTags()
        if (result.success && result.data) {
            setTags(result.data)
        }
        setIsLoading(false)
    }

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

    const handleToggleTag = (tagId: string) => {
        if (selectedTagIds.includes(tagId)) {
            onChange(selectedTagIds.filter(id => id !== tagId))
        } else {
            onChange([...selectedTagIds, tagId])
        }
    }

    const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id))
    const availableTags = tags.filter(tag => !selectedTagIds.includes(tag.id))

    if (isLoading) {
        return <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
    }

    return (
        <div className="space-y-3">
            {/* Selected tags */}
            {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedTags.map(tag => (
                        <div
                            key={tag.id}
                            className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-primary text-primary-foreground rounded-md"
                        >
                            <span>{tag.name}</span>
                            <button
                                type="button"
                                onClick={() => handleToggleTag(tag.id)}
                                className="hover:bg-primary/80 rounded-sm"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Available tags */}
            {availableTags.length > 0 && (
                <div className="space-y-2">
                    <div className="text-sm font-medium">{t('tags.selectTags')}</div>
                    <div className="flex flex-wrap gap-2">
                        {availableTags.map(tag => (
                            <button
                                key={tag.id}
                                type="button"
                                onClick={() => handleToggleTag(tag.id)}
                                className="px-2 py-1 text-sm border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                {tag.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Create new tag */}
            {!isCreating ? (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreating(true)}
                    className="w-full"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('tags.createTag')}
                </Button>
            ) : (
                <div className="flex gap-2">
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
