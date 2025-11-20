"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface CategoryFilterProps {
  categories: Array<{ id: string; name: string }>
}

/**
 * 分类筛选组件
 * Category filter component with single-select support
 */
export function CategoryFilter({ categories }: CategoryFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // 从URL获取已选择的分类
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(() => {
    return searchParams.get('categoryId') || null
  })

  // 当选择变化时更新URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (selectedCategoryId) {
      params.set('categoryId', selectedCategoryId)
      // 筛选时重置到第一页
      params.set('page', '1')
    } else {
      params.delete('categoryId')
    }
    
    router.push(`${pathname}?${params.toString()}`)
  }, [selectedCategoryId, pathname, router, searchParams])

  // 选择分类
  const selectCategory = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId)
  }

  if (categories.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        {t('categories.noCategories')}
      </div>
    )
  }

  return (
    <div className="space-y-3" role="group" aria-labelledby="category-filter-heading">
      <div className="flex items-center justify-between">
        <h3 id="category-filter-heading" className="font-medium text-sm">{t('search.filterByCategory')}</h3>
        {selectedCategoryId && (
          <Badge variant="secondary" className="text-xs" aria-label="已选择 1 个分类">
            1
          </Badge>
        )}
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto" role="radiogroup" aria-labelledby="category-filter-heading">
        {/* 全部分类选项 */}
        <Button
          variant={selectedCategoryId === null ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start text-sm font-normal",
            selectedCategoryId === null && "bg-secondary"
          )}
          onClick={() => selectCategory(null)}
          role="radio"
          aria-checked={selectedCategoryId === null}
        >
          {t('categories.noCategory')}
        </Button>
        
        {/* 分类列表 */}
        {categories.map((category) => {
          const isSelected = selectedCategoryId === category.id
          return (
            <Button
              key={category.id}
              variant={isSelected ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start text-sm font-normal",
                isSelected && "bg-secondary"
              )}
              onClick={() => selectCategory(category.id)}
              role="radio"
              aria-checked={isSelected}
            >
              {category.name}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
