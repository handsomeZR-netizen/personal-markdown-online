"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useDebounce } from "@/hooks/use-debounce"
import { t } from "@/lib/i18n"

interface SearchBarProps {
  placeholder?: string
  className?: string
  /** 是否启用展开/收缩模式（用于页眉） */
  expandable?: boolean
}

/**
 * 搜索栏组件
 * Search bar component with debouncing and URL parameter support
 * 支持点击展开/收缩模式
 */
export function SearchBar({ 
  placeholder = t('search.searchPlaceholder'),
  className = "",
  expandable = false
}: SearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // 从URL获取初始搜索值
  const [searchValue, setSearchValue] = useState(searchParams.get('query') || '')
  // 控制展开状态
  const [isExpanded, setIsExpanded] = useState(false)
  
  // 使用防抖（300ms）
  const debouncedSearchValue = useDebounce(searchValue, 300)

  // 当防抖值变化时更新URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (debouncedSearchValue) {
      params.set('query', debouncedSearchValue)
      // 搜索时重置到第一页
      params.set('page', '1')
    } else {
      params.delete('query')
    }
    
    // 更新URL（不刷新页面）
    router.push(`${pathname}?${params.toString()}`)
  }, [debouncedSearchValue, pathname, router, searchParams])

  // 点击外部时收缩
  useEffect(() => {
    if (!expandable) return
    
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // 只有在没有搜索内容时才收缩
        if (!searchValue) {
          setIsExpanded(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [expandable, searchValue])

  // 清除搜索
  const handleClear = () => {
    setSearchValue('')
    if (expandable) {
      setIsExpanded(false)
    }
  }

  // 点击展开
  const handleExpand = () => {
    if (expandable && !isExpanded) {
      setIsExpanded(true)
      // 延迟聚焦，等待动画开始
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  // 如果是可展开模式
  if (expandable) {
    return (
      <div 
        ref={containerRef}
        className={`relative transition-all duration-300 ease-in-out ${className}`}
        role="search"
      >
        <div 
          className={`
            relative flex items-center cursor-pointer
            transition-all duration-300 ease-in-out
            ${isExpanded ? 'w-64' : 'w-24'}
          `}
          onClick={handleExpand}
        >
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" 
            aria-hidden="true" 
          />
          <Input
            ref={inputRef}
            type="search"
            placeholder={isExpanded ? placeholder : ""}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            className={`
              pl-9 pr-9 transition-all duration-300 ease-in-out
              ${isExpanded ? 'opacity-100' : 'opacity-70 cursor-pointer'}
            `}
            aria-label={t('search.searchNotes')}
          />
          {searchValue && isExpanded && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
              title={t('common.clear')}
              aria-label={t('common.clear')}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  // 普通模式（非展开）
  return (
    <div className={`relative ${className}`} role="search">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <Input
        type="search"
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="pl-9 pr-9"
        aria-label={t('search.searchNotes')}
      />
      {searchValue && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={handleClear}
          title={t('common.clear')}
          aria-label={t('common.clear')}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}
