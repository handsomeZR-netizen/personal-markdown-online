"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { t } from "@/lib/i18n"

interface TagFilterProps {
  tags: Array<{ id: string; name: string }>
}

/**
 * 标签筛选组件
 * Tag filter component with multi-select support
 */
export function TagFilter({ tags }: TagFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // 从URL获取已选择的标签
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(() => {
    const tagIdsParam = searchParams.get('tagIds')
    return tagIdsParam ? tagIdsParam.split(',') : []
  })

  // 当选择变化时更新URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (selectedTagIds.length > 0) {
      params.set('tagIds', selectedTagIds.join(','))
      // 筛选时重置到第一页
      params.set('page', '1')
    } else {
      params.delete('tagIds')
    }
    
    router.push(`${pathname}?${params.toString()}`)
  }, [selectedTagIds, pathname, router, searchParams])

  // 切换标签选择
  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId)
      } else {
        return [...prev, tagId]
      }
    })
  }

  if (tags.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        {t('tags.noTags')}
      </div>
    )
  }

  return (
    <div className="space-y-3" role="group" aria-labelledby="tag-filter-heading">
      <div className="flex items-center justify-between">
        <h3 id="tag-filter-heading" className="font-medium text-sm">{t('search.filterByTags')}</h3>
        {selectedTagIds.length > 0 && (
          <Badge variant="secondary" className="text-xs" aria-label={`已选择 ${selectedTagIds.length} 个标签`}>
            {selectedTagIds.length}
          </Badge>
        )}
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto" role="list">
        {tags.map((tag) => {
          const isChecked = selectedTagIds.includes(tag.id)
          return (
            <div key={tag.id} className="flex items-center space-x-2" role="listitem">
              <Checkbox
                id={`tag-${tag.id}`}
                checked={isChecked}
                onCheckedChange={() => toggleTag(tag.id)}
                aria-label={`筛选标签: ${tag.name}`}
              />
              <Label
                htmlFor={`tag-${tag.id}`}
                className="text-sm font-normal cursor-pointer flex-1"
              >
                {tag.name}
              </Label>
            </div>
          )
        })}
      </div>
    </div>
  )
}
