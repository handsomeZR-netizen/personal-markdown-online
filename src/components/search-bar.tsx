"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useDebounce } from "@/hooks/use-debounce"
import { t } from "@/lib/i18n"

interface SearchBarProps {
  placeholder?: string
  className?: string
}

/**
 * 搜索栏组件
 * Search bar component with debouncing and URL parameter support
 */
export function SearchBar({ 
  placeholder = t('search.searchPlaceholder'),
  className = ""
}: SearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // 从URL获取初始搜索值
  const [searchValue, setSearchValue] = useState(searchParams.get('query') || '')
  
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

  // 清除搜索
  const handleClear = () => {
    setSearchValue('')
  }

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
