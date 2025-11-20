"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { TagFilter } from "./tag-filter"
import { CategoryFilter } from "./category-filter"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Filter } from "lucide-react"
import { t } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface FilterPanelProps {
  tags: Array<{ id: string; name: string }>
  categories: Array<{ id: string; name: string }>
}

/**
 * 筛选面板组件
 * Filter panel component combining search, tags, and categories
 */
export function FilterPanel({ tags, categories }: FilterPanelProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // 获取当前筛选条件
  const query = searchParams.get('query')
  const tagIds = searchParams.get('tagIds')?.split(',').filter(Boolean) || []
  const categoryId = searchParams.get('categoryId')

  // 计算活跃筛选条件数量
  const activeFiltersCount = 
    (query ? 1 : 0) + 
    tagIds.length + 
    (categoryId ? 1 : 0)

  // 清除所有筛选条件
  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('query')
    params.delete('tagIds')
    params.delete('categoryId')
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  // 移除单个筛选条件
  const removeFilter = (type: 'query' | 'tag' | 'category', value?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (type === 'query') {
      params.delete('query')
    } else if (type === 'tag' && value) {
      const currentTags = params.get('tagIds')?.split(',').filter(Boolean) || []
      const newTags = currentTags.filter(id => id !== value)
      if (newTags.length > 0) {
        params.set('tagIds', newTags.join(','))
      } else {
        params.delete('tagIds')
      }
    } else if (type === 'category') {
      params.delete('categoryId')
    }
    
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  // 获取标签名称
  const getTagName = (tagId: string) => {
    return tags.find(tag => tag.id === tagId)?.name || tagId
  }

  // 获取分类名称
  const getCategoryName = (catId: string) => {
    return categories.find(cat => cat.id === catId)?.name || catId
  }

  return (
    <Card role="region" aria-label="筛选面板">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" aria-hidden="true" />
            {t('common.filter')}
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs"
              aria-label={t('search.clearFilters')}
            >
              {t('search.clearFilters')}
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 显示活跃的筛选条件 */}
        {activeFiltersCount > 0 && (
          <div className="space-y-2" role="region" aria-label="已应用的筛选条件">
            <h4 className="text-sm font-medium text-muted-foreground">
              {t('search.appliedFilters')} ({activeFiltersCount})
            </h4>
            <div className="flex flex-wrap gap-2" role="list">
              {/* 关键词筛选 */}
              {query && (
                <Badge variant="secondary" className="gap-1" role="listitem">
                  {t('search.keyword')}: {query}
                  <button
                    onClick={() => removeFilter('query')}
                    className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                    aria-label={`移除关键词筛选: ${query}`}
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </Badge>
              )}
              
              {/* 标签筛选 */}
              {tagIds.map(tagId => (
                <Badge key={tagId} variant="secondary" className="gap-1" role="listitem">
                  {getTagName(tagId)}
                  <button
                    onClick={() => removeFilter('tag', tagId)}
                    className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                    aria-label={`移除标签筛选: ${getTagName(tagId)}`}
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </Badge>
              ))}
              
              {/* 分类筛选 */}
              {categoryId && (
                <Badge variant="secondary" className="gap-1" role="listitem">
                  {getCategoryName(categoryId)}
                  <button
                    onClick={() => removeFilter('category')}
                    className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                    aria-label={`移除分类筛选: ${getCategoryName(categoryId)}`}
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* 标签筛选 */}
        <TagFilter tags={tags} />

        {/* 分类筛选 */}
        <CategoryFilter categories={categories} />
      </CardContent>
    </Card>
  )
}
