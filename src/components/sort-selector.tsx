"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { t } from "@/lib/i18n"

type SortOption = 'createdAt' | 'updatedAt' | 'title'
type SortOrder = 'asc' | 'desc'

type SortSelectorProps = {
    baseUrl?: string
}

export function SortSelector({ baseUrl = "/notes" }: SortSelectorProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    const currentSortBy = (searchParams.get("sortBy") as SortOption) || 'createdAt'
    const currentSortOrder = (searchParams.get("sortOrder") as SortOrder) || 'desc'

    const sortOptions: { value: SortOption; label: string }[] = [
        { value: 'createdAt', label: t('sort.createdAt') },
        { value: 'updatedAt', label: t('sort.updatedAt') },
        { value: 'title', label: t('sort.title') },
    ]

    const handleSortChange = (sortBy: SortOption) => {
        const params = new URLSearchParams(searchParams.toString())
        
        // 如果点击的是当前排序字段，切换排序顺序
        if (sortBy === currentSortBy) {
            const newOrder = currentSortOrder === 'asc' ? 'desc' : 'asc'
            params.set("sortOrder", newOrder)
        } else {
            // 如果是新的排序字段，使用默认排序顺序
            params.set("sortBy", sortBy)
            params.set("sortOrder", sortBy === 'title' ? 'asc' : 'desc')
        }
        
        // 重置到第一页
        params.set("page", "1")
        
        router.push(`${baseUrl}?${params.toString()}`)
    }

    const getSortIcon = (sortBy: SortOption) => {
        if (sortBy !== currentSortBy) {
            return <ArrowUpDown className="h-4 w-4 ml-1" />
        }
        return currentSortOrder === 'asc' 
            ? <ArrowUp className="h-4 w-4 ml-1" />
            : <ArrowDown className="h-4 w-4 ml-1" />
    }

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">{t('sort.sortBy')}:</span>
            {sortOptions.map((option) => (
                <Button
                    key={option.value}
                    variant={currentSortBy === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSortChange(option.value)}
                    className="flex items-center"
                >
                    {option.label}
                    {getSortIcon(option.value)}
                </Button>
            ))}
        </div>
    )
}
