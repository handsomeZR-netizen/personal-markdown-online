"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getCategories, createCategory, deleteCategory } from "@/lib/actions/categories"
import { t } from "@/lib/i18n"
import { Plus, Check, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Category {
    id: string
    name: string
}

interface CategorySelectorProps {
    selectedCategoryId?: string
    onChange: (categoryId: string | undefined) => void
}

export function CategorySelector({ selectedCategoryId, onChange }: CategorySelectorProps) {
    const [categories, setCategories] = useState<Category[]>([])
    const [isCreating, setIsCreating] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function loadCategories() {
            setIsLoading(true)
            const result = await getCategories()
            if (result.success && result.data) {
                setCategories(result.data)
            }
            setIsLoading(false)
        }
        
        loadCategories()
    }, [])

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return

        const result = await createCategory(newCategoryName.trim())
        if (result.success && result.data) {
            setCategories([...categories, result.data])
            onChange(result.data.id)
            setNewCategoryName("")
            setIsCreating(false)
            toast.success(t('categories.createSuccess'))
        } else {
            toast.error(t('categories.createError'))
        }
    }

    const handleSelectCategory = (categoryId: string) => {
        if (selectedCategoryId === categoryId) {
            onChange(undefined)
        } else {
            onChange(categoryId)
        }
    }

    const handleDeleteCategory = async (categoryId: string, categoryName: string, e: React.MouseEvent) => {
        e.stopPropagation()
        
        if (!confirm(`确定要删除分类 "${categoryName}" 吗？`)) {
            return
        }

        const result = await deleteCategory(categoryId)
        if (result.success) {
            setCategories(categories.filter(c => c.id !== categoryId))
            if (selectedCategoryId === categoryId) {
                onChange(undefined)
            }
            toast.success('分类删除成功')
        } else {
            toast.error(result.error || '删除分类失败')
        }
    }

    if (isLoading) {
        return <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
    }

    return (
        <div className="space-y-3">
            {/* Categories list */}
            {categories.length > 0 && (
                <div className="space-y-2">
                    <div className="text-sm font-medium">{t('categories.selectCategory')}</div>
                    <div className="grid grid-cols-2 gap-2">
                        {categories.map(category => (
                            <div
                                key={category.id}
                                className={`relative group px-3 py-2 text-sm border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between cursor-pointer ${
                                    selectedCategoryId === category.id
                                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                        : ''
                                }`}
                                onClick={() => handleSelectCategory(category.id)}
                            >
                                <span className="flex-1">{category.name}</span>
                                <div className="flex items-center gap-1">
                                    {selectedCategoryId === category.id && (
                                        <Check className="h-4 w-4" />
                                    )}
                                    <button
                                        type="button"
                                        onClick={(e) => handleDeleteCategory(category.id, category.name, e)}
                                        className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity p-1"
                                        title="删除分类"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Clear selection */}
            {selectedCategoryId && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onChange(undefined)}
                    className="w-full"
                >
                    {t('categories.noCategory')}
                </Button>
            )}

            {/* Create new category */}
            {!isCreating ? (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreating(true)}
                    className="w-full"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('categories.createCategory')}
                </Button>
            ) : (
                <div className="flex gap-2">
                    <Input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder={t('categories.categoryName')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                handleCreateCategory()
                            }
                            if (e.key === 'Escape') {
                                setIsCreating(false)
                                setNewCategoryName("")
                            }
                        }}
                        autoFocus
                    />
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleCreateCategory}
                    >
                        {t('common.create')}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setIsCreating(false)
                            setNewCategoryName("")
                        }}
                    >
                        {t('common.cancel')}
                    </Button>
                </div>
            )}
        </div>
    )
}
