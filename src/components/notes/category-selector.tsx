"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { t } from "@/lib/i18n"
import { Plus, X } from "lucide-react"
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
            try {
                const response = await fetch('/api/categories')
                const result = await response.json()
                if (result.success && result.data) {
                    setCategories(result.data)
                } else {
                    console.error('Failed to load categories:', result.error)
                    setCategories([])
                }
            } catch (error) {
                console.error('Error loading categories:', error)
                setCategories([])
            } finally {
                setIsLoading(false)
            }
        }
        
        loadCategories()
    }, [])

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return

        try {
            const response = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCategoryName.trim() }),
            })
            const result = await response.json()
            if (result.success && result.data) {
                setCategories([...categories, result.data])
                onChange(result.data.id)
                setNewCategoryName("")
                setIsCreating(false)
                toast.success(t('categories.createSuccess'))
            } else {
                toast.error(t('categories.createError'))
            }
        } catch (error) {
            console.error('Error creating category:', error)
            toast.error(t('categories.createError'))
        }
    }

    if (isLoading) {
        return <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
    }

    return (
        <div className="flex items-center gap-2">
            {!isCreating ? (
                <>
                    <Select
                        value={selectedCategoryId || "none"}
                        onValueChange={(value) => onChange(value === "none" ? undefined : value)}
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder={t('categories.selectCategory')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">{t('categories.noCategory')}</SelectItem>
                            {categories.map(category => (
                                <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setIsCreating(true)}
                        title={t('categories.createCategory')}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </>
            ) : (
                <>
                    <Input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder={t('categories.categoryName')}
                        className="w-[160px]"
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
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setIsCreating(false)
                            setNewCategoryName("")
                        }}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </>
            )}
        </div>
    )
}
